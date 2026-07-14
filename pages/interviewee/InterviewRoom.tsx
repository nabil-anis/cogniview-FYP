import React, { useState, useEffect, useRef } from 'react';
import { Button, BackButton } from '../../components/Shared';
import { db } from '../../services/db';
import { Interview, Profile, InterviewSession, InterviewResponse } from '../../types';
import VapiDefault from '@vapi-ai/web';
import { FaceDetector, ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { aiService } from '../../services/gemini';

const safeAlert = (msg: string) => {
  try {
    alert(msg);
  } catch (e) {
    console.warn("Alert blocked/failed:", msg, e);
  }
};

export const InterviewRoom: React.FC<{ user: Profile, onComplete: () => void, onBack: () => void }> = ({ user, onComplete, onBack }) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [status, setStatus] = useState<'loading' | 'instructions' | 'connecting' | 'live' | 'completed' | 'terminated' | 'saving' | 'submission-success' | 'submission-failed'>('loading');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [faceWarning, setFaceWarning] = useState<string | null>(null);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [cameraAtAngle, setCameraAtAngle] = useState<boolean>(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState<boolean>(false);
  const [savingProgress, setSavingProgress] = useState<string>('Preparing finalization...');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const vapiRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  
  const lastVideoTimeRef = useRef(-1);
  const lastDetectionTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const noFaceTimerRef = useRef(0);
  const multiFaceTimerRef = useRef(0);
  const gazeTimerRef = useRef(0);
  const mobileTimerRef = useRef(0);
  const suspiciousTimerRef = useRef(0);
  const isTerminatingRef = useRef(false);
  const connectionTimeoutRef = useRef<any>(null);
  const transcriptTurnsRef = useRef<{ role: 'assistant' | 'user'; text: string }[]>([]);
  const retrySaveRef = useRef<(() => Promise<void>) | null>(null);

  // Intercept Browser Back Button during active interview
  useEffect(() => {
    if (status === 'connecting' || status === 'live') {
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
        setShowConfirmLeave(true);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [status]);

  // Initialize Session
  useEffect(() => {
    mountedRef.current = true;
    const initSession = async () => {
      try {
        const sessions = await db.sessions.getByCandidateId(user.id);
        const active = sessions.find(s => s.status === 'in_progress');
        
        if (!active) {
            console.warn("No active session found.");
            onComplete();
            return;
        }

        setSession(active);

        const allInterviews = await db.interviews.getAll();
        const i = allInterviews.find(x => x.id === active.interviewId);
        
        if (!i) {
            safeAlert("Critical Error: Assessment data missing.");
            onComplete();
            return;
        }

        setInterview(i);
        setStatus('instructions');

        // Setup Vapi
        const publicKey = '08163664-575c-457e-814a-bafae9bc0eda'; 
        let VapiClass: any = VapiDefault;
        if (VapiClass && typeof VapiClass === 'object' && 'default' in VapiClass) {
            VapiClass = VapiClass.default;
        }
        if (!VapiClass) {
            throw new Error("Vapi library could not be loaded or default export resolved.");
        }
        const vapi = new VapiClass(publicKey); 
        vapiRef.current = vapi;

        // Vapi Event Listeners
        vapi.on('call-start', () => {
            console.log('Call has started');
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
            if (mountedRef.current) setStatus('live');
        });

        vapi.on('call-start-failed', (e: any) => {
            console.error('Call start failed event:', e);
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
            if (mountedRef.current) {
                safeAlert("Failed to connect to AI server. Please try again.");
                setStatus('instructions');
            }
        });

        vapi.on('call-end', () => {
            console.log('Call has ended via event');
            handleCallEndGracefully();
        });

        vapi.on('volume-level', (volume: number) => {
            if (mountedRef.current) setVolumeLevel(volume);
        });

        vapi.on('error', (e: any) => {
            console.log('Vapi Error Event:', e);
            const msg = e?.error?.message || e?.message || JSON.stringify(e);
            
            // "Meeting ended due to ejection" is often just the agent hanging up via tool call
            if (msg.includes("ejection") || msg.includes("Meeting has ended") || msg.includes("Room closed")) {
                handleCallEndGracefully();
            } else {
                console.warn("Non-fatal Vapi Error:", msg);
            }
        });

        // Vapi Message event handler for transcript monitoring (to detect automatic end of questions)
        vapi.on('message', (message: any) => {
            console.log('Vapi Message received:', message);
            if (message?.type === 'transcript' && message?.transcriptType === 'final') {
                const text = message.transcript || "";
                const role = message.role; // 'assistant' or 'user'
                if (text && (role === 'assistant' || role === 'user')) {
                    transcriptTurnsRef.current.push({ role, text });
                    console.log(`[Transcript Turn Added] ${role}: ${text}`);
                }

                if (role === 'assistant') {
                    const textLower = text.toLowerCase();
                    // Indicators that the agent has finished all questions and is wrapping up
                    const isClosingMessage = 
                        textLower.includes("concludes our interview") || 
                        textLower.includes("conclude our interview") || 
                        textLower.includes("concludes the interview") || 
                        textLower.includes("interview is complete") || 
                        textLower.includes("responses have been recorded") ||
                        textLower.includes("best of luck") ||
                        textLower.includes("have a great day") ||
                        textLower.includes("thank you for your time");

                    if (isClosingMessage) {
                        console.log("Assistant spoke closing phrase. Setting auto-finish timer.");
                        // Give 6 seconds to complete the spoken sentence naturally
                        setTimeout(() => {
                            if (mountedRef.current) {
                                console.log("Auto-finishing interview room.");
                                finishSession('completed');
                            }
                        }, 6000);
                    }
                }
            }
        });

      } catch (err) {
          console.error("Init Error:", err);
          safeAlert("Failed to initialize system.");
          onComplete();
      }
    };

    initSession();

    return () => { 
        mountedRef.current = false;
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
        }
        if (vapiRef.current) {
            try {
                vapiRef.current.stop();
            } catch (e) {}
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => track.stop());
            } catch (e) {}
        }
    };
  }, [user.id]);

  const handleCallEndGracefully = () => {
      if (isTerminatingRef.current) return;
      if (!mountedRef.current) return;
      
      // If we are already terminated, don't override with 'completed'
      if (status === 'terminated') return;

      finishSession('completed');
  };

  // --- DETECTORS SETUP ---
  useEffect(() => {
      const loadDetectors = async () => {
          try {
              const vision = await FilesetResolver.forVisionTasks(
                  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
              );
              
              // Load Face Detector
              faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
                  baseOptions: {
                      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                      delegate: "GPU"
                  },
                  runningMode: "VIDEO"
              });
              console.log("Face Detector Loaded");

              // Load Object Detector (COCO trained EfficientDet-Lite0 for cell phones, laptops, books, etc.)
              try {
                  objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
                      baseOptions: {
                          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                          delegate: "GPU"
                      },
                      runningMode: "VIDEO",
                      scoreThreshold: 0.35
                  });
                  console.log("Object/Device Detector Loaded");
              } catch (objErr) {
                  console.warn("Could not load Object Detector, continuing with Face/Gaze only:", objErr);
              }
              
          } catch (e) {
              console.error("Failed to load Vision Tasks", e);
          }
      };
      loadDetectors();
  }, []);

  // --- CONSOLIDATED SECURITY DETECTIONS LOOP ---
  const runSecurityDetections = () => {
      if (!videoRef.current || status !== 'live') return;
      if (videoRef.current.readyState < 2) {
          requestRef.current = requestAnimationFrame(runSecurityDetections);
          return;
      }

      const video = videoRef.current;
      const now = performance.now();
      
      // Throttle heavy ML inference to once every 250ms to ensure butter-smooth 60 FPS UI refresh rate
      if (now - lastDetectionTimeRef.current >= 250) {
          const elapsed = lastDetectionTimeRef.current === 0 ? 250 : Math.min(now - lastDetectionTimeRef.current, 1000);
          lastDetectionTimeRef.current = now;
          
          let activeWarning: string | null = null;
          let terminateReason: string | null = null;
          const timestamp = performance.now();

          // 1. FACE DETECTION
          if (faceDetectorRef.current) {
              try {
                  const faceResult = faceDetectorRef.current.detectForVideo(video, timestamp);
                  const faces = faceResult.detections;
                  const count = faces?.length || 0;
                  setFaceCount(count);

                  if (count === 0) {
                      noFaceTimerRef.current += elapsed;
                      multiFaceTimerRef.current = 0;
                      gazeTimerRef.current = 0; // reset gaze if no face is seen
                      
                      if (noFaceTimerRef.current > 12000) { // 12s warning
                          activeWarning = "⚠️ No face detected. Please return to frame.";
                      }
                      if (noFaceTimerRef.current > 60000) { // 60s termination
                          terminateReason = "No face detected for >60 seconds.";
                      }
                  } else if (count > 1) {
                      multiFaceTimerRef.current += elapsed;
                      noFaceTimerRef.current = 0;
                      gazeTimerRef.current = 0;
                      
                      activeWarning = "⚠️ Security Alert: Multiple faces detected.";
                      if (multiFaceTimerRef.current > 20000) { // 20s termination
                          terminateReason = "Multiple faces detected in secure environment.";
                      }
                  } else {
                      // Exactly 1 face - decay face alerts
                      noFaceTimerRef.current = Math.max(0, noFaceTimerRef.current - (elapsed / 2));
                      multiFaceTimerRef.current = Math.max(0, multiFaceTimerRef.current - (elapsed / 2));

                      // --- EYE GAZE / HEAD TURN TRACKING ---
                      if (!cameraAtAngle) {
                          const face = faces[0];
                          const keypoints = face.keypoints;
                          if (keypoints && keypoints.length >= 3) {
                              const rightEye = keypoints[0]; // Right eye (of face)
                              const leftEye = keypoints[1];  // Left eye (of face)
                              const nose = keypoints[2];     // Nose tip

                              if (rightEye && leftEye && nose) {
                                  const eyeDist = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
                                  const eyeMidX = (leftEye.x + rightEye.x) / 2;
                                  const eyeMidY = (leftEye.y + rightEye.y) / 2;
                                  
                                  const horizontalDev = Math.abs(nose.x - eyeMidX) / eyeDist;
                                  const verticalDev = Math.abs(nose.y - eyeMidY) / eyeDist;

                                  // Extremely lenient thresholds to allow standard camera layouts and angles
                                  if (horizontalDev > 0.85 || verticalDev > 0.95) {
                                      gazeTimerRef.current += elapsed;
                                      if (gazeTimerRef.current > 10000) { // 10s warning
                                          activeWarning = "⚠️ Just a reminder: please look directly at the screen and camera.";
                                      }
                                      // NEVER terminate candidate for gaze tracking anymore
                                  } else {
                                      gazeTimerRef.current = Math.max(0, gazeTimerRef.current - (elapsed / 2));
                                  }
                              }
                          }
                      } else {
                          gazeTimerRef.current = 0;
                      }
                  }
              } catch (e) {
                  // Ignore transient detection errors
              }
          }

          // 2. OBJECT / DEVICE DETECTION
          if (objectDetectorRef.current && !terminateReason) {
              try {
                  const objResult = objectDetectorRef.current.detectForVideo(video, timestamp);
                  const detections = objResult.detections || [];

                  let mobileDetectedThisFrame = false;
                  let suspiciousDetectedThisFrame = false;

                  for (const det of detections) {
                      const category = det.categories?.[0];
                      if (category) {
                          const name = category.categoryName?.toLowerCase() || "";
                          const score = category.score || 0;

                          if (name === 'cell phone' && score > 0.38) {
                              mobileDetectedThisFrame = true;
                          } else if ((name === 'book' || name === 'laptop' || name === 'tablet' || name === 'electronic device') && score > 0.45) {
                              suspiciousDetectedThisFrame = true;
                          }
                      }
                  }

                  if (mobileDetectedThisFrame) {
                      mobileTimerRef.current += elapsed;
                      if (mobileTimerRef.current > 5000) { // 5s warning
                          activeWarning = "⚠️ Security Alert: Mobile phone detected! Usage is strictly prohibited.";
                      }
                      if (mobileTimerRef.current > 30000) { // 30s termination
                          terminateReason = "Mobile device detected in secure environment.";
                      }
                  } else {
                      mobileTimerRef.current = Math.max(0, mobileTimerRef.current - (elapsed / 2));
                  }

                  if (suspiciousDetectedThisFrame && !mobileDetectedThisFrame) {
                      suspiciousTimerRef.current += elapsed;
                      if (suspiciousTimerRef.current > 8000) { // 8s warning
                          activeWarning = "⚠️ Security Alert: Suspicious object or secondary device detected.";
                      }
                      if (suspiciousTimerRef.current > 40000) { // 40s termination
                          terminateReason = "Suspicious object or device detected in secure environment.";
                      }
                  } else {
                      suspiciousTimerRef.current = Math.max(0, suspiciousTimerRef.current - (elapsed / 2));
                  }

              } catch (e) {
                  // Ignore transient detection errors
              }
          }

          // Apply warnings & termination
          setFaceWarning(activeWarning);

          if (terminateReason) {
              terminateSession(terminateReason);
              return;
          }
      }
      requestRef.current = requestAnimationFrame(runSecurityDetections);
  };

  // Start loop when live
  useEffect(() => {
      if (status === 'live') {
          lastDetectionTimeRef.current = performance.now();
          requestRef.current = requestAnimationFrame(runSecurityDetections);
      } else {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, [status]);


  // Timer
  useEffect(() => {
    let interval: any;
    if (status === 'live') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // --- ANTI-CHEAT (SAVE BROWSER) ---
  useEffect(() => {
    if (status !== 'live' && status !== 'connecting') return;

    const handleViolation = () => {
      if (!session) return;
      terminateSession("Browser focus lost or Fullscreen exited.");
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const onFullScreenChange = () => {
        if (!document.fullscreenElement) {
             handleViolation();
        }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullScreenChange);

    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullScreenChange);
    };
  }, [status, session]);

  const enterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen denied", e);
    }
  };

  const terminateSession = async (reason: string) => {
    if (isTerminatingRef.current) return;
    isTerminatingRef.current = true;
    
    setStatus('terminated');
    
    // Immediately stop camera tracks so the webcam light turns off
    if (streamRef.current) {
        try {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        } catch (e) {}
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }

    try {
        if (vapiRef.current) vapiRef.current.stop();
    } catch(e) {}

    if (session) {
        db.sessions.update({ 
            ...session, 
            status: 'terminated_early', 
            completedAt: Date.now(),
            terminationReason: reason,
            decision: 'failed'
        }).catch(dbErr => {
            console.error("Database error updating terminated session:", dbErr);
        });
    }

    if (document.fullscreenElement) {
        try {
            document.exitFullscreen().catch(() => {});
        } catch (e) {}
    }

    safeAlert(`⚠️ INTERVIEW TERMINATED\nReason: ${reason}`);
    onComplete();
  };

  const processTurnsToResponses = (sessionId: string, turns: { role: 'assistant' | 'user', text: string }[]): InterviewResponse[] => {
    const responses: InterviewResponse[] = [];
    let currentQuestion = "";
    let currentAnswer = "";

    for (const turn of turns) {
      if (turn.role === 'assistant') {
        if (currentAnswer) {
          responses.push({
            id: Math.random().toString(36).substr(2, 9),
            sessionId,
            questionId: `q-${responses.length}`,
            questionText: currentQuestion.trim(),
            responseText: currentAnswer.trim(),
            timestamp: Date.now()
          });
          currentQuestion = "";
          currentAnswer = "";
        }
        currentQuestion += (currentQuestion ? " " : "") + turn.text;
      } else if (turn.role === 'user') {
        if (currentQuestion) {
          currentAnswer += (currentAnswer ? " " : "") + turn.text;
        }
      }
    }

    if (currentQuestion && currentAnswer) {
      responses.push({
        id: Math.random().toString(36).substr(2, 9),
        sessionId,
        questionId: `q-${responses.length}`,
        questionText: currentQuestion.trim(),
        responseText: currentAnswer.trim(),
        timestamp: Date.now()
      });
    }

    return responses;
  };

  const finishSession = async (finalStatus: 'completed' | 'terminated_early', overrideReason?: string) => {
    if (isTerminatingRef.current) return;
    isTerminatingRef.current = true;
    setIsSubmitting(true);
    setSavingProgress("Closing AI interviewer connection securely...");
    
    // Clear any active connection timeout
    if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
    }

    // Stop Vapi and detach listeners to prevent race conditions or unexpected triggers
    try {
        if (vapiRef.current) {
            vapiRef.current.stop();
            if (typeof vapiRef.current.removeAllListeners === 'function') {
                vapiRef.current.removeAllListeners();
            } else if (typeof vapiRef.current.off === 'function') {
                vapiRef.current.off();
            }
        }
    } catch (e) {
        console.warn("Failed to stop Vapi:", e);
    }

    // Immediately stop camera tracks so the webcam light turns off
    setSavingProgress("Safely disconnecting webcam stream...");
    if (streamRef.current) {
        try {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        } catch (e) {}
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }

    // Exit Fullscreen if active
    if (document.fullscreenElement) {
        try {
            document.exitFullscreen().catch(() => {});
        } catch (e) {}
    }

    if (!session) return;
    
    // Transition to 'saving' status immediately to show saving overlay
    setStatus('saving');
    setSaveError(null);

    // Prepare response data
    const turns = transcriptTurnsRef.current;
    const processedResponses = processTurnsToResponses(session.id, turns);

    // Async save function that supports retry
    const saveDataWithRetry = async () => {
        try {
            setIsSubmitting(true);
            setSavingProgress("Formatting and packaging interview responses...");
            await new Promise(resolve => setTimeout(resolve, 800));

            // 1. Save all processed responses to Supabase/DB
            if (processedResponses.length > 0) {
                setSavingProgress(`Securing transcripts (${processedResponses.length} answers parsed)...`);
                for (let i = 0; i < processedResponses.length; i++) {
                    const resp = processedResponses[i];
                    setSavingProgress(`Synchronizing transcript turn ${i + 1} of ${processedResponses.length}...`);
                    await db.responses.save(resp);
                }
            } else {
                setSavingProgress("Parsing short-session audio markers...");
            }

            // 2. Update session record
            setSavingProgress("Updating session state history...");
            await db.sessions.update({
                ...session,
                status: finalStatus,
                completedAt: Date.now(),
                terminationReason: overrideReason || session.terminationReason
            });

            // 3. Eagerly generate AI Evaluation
            if (processedResponses.length > 0 && interview) {
                setSavingProgress("Analyzing verbal response vectors using Gemini...");
                try {
                    const result = await aiService.evaluateCandidate(
                        interview.jobRole,
                        interview.parameters,
                        processedResponses.map(r => ({ q: r.questionText, a: r.responseText }))
                    );
                    
                    setSavingProgress("Assembling detailed HR scorecard & sentiment analysis...");
                    const ev = {
                        id: Math.random().toString(36).substr(2, 9),
                        responseId: processedResponses[0]?.id || 'none',
                        ...result
                    };
                    await db.evaluations.save(ev);
                    setSavingProgress("Evaluation successfully stored for recruiter review!");
                } catch (evalErr) {
                    console.error("Non-fatal eager evaluation error:", evalErr);
                    setSavingProgress("Responses secured. Metric generation pending recruiter review...");
                }
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            setSavingProgress("All interview data secured and synced successfully!");
            await new Promise(resolve => setTimeout(resolve, 600));

            if (mountedRef.current) {
                setStatus('submission-success');
            }
        } catch (err) {
            console.error("Database save failed during finishSession:", err);
            if (mountedRef.current) {
                setSaveError(err instanceof Error ? err.message : String(err));
                setStatus('submission-failed');
            }
        } finally {
            if (mountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    // Store saveDataWithRetry ref so the UI "Retry" button can call it!
    retrySaveRef.current = saveDataWithRetry;

    // Run first attempt
    await saveDataWithRetry();
  };

  const startCall = async () => {
    if (!interview || !session) return;
    
    await enterFullScreen();
    setStatus('connecting');

    // Clear any previous connection timeout
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    
    // Start connection timeout (20s) to prevent infinite loading screen
    connectionTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && vapiRef.current) {
            console.warn("Vapi connection timed out.");
            try {
                vapiRef.current.stop();
            } catch (e) {}
            
            // Clean up camera stream
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                } catch (e) {}
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
            safeAlert("Connection Timed Out: Failed to establish secure connection with AI Interviewer. Please verify your internet connection and try again.");
            setStatus('instructions');
        }
    }, 20000);

    // Start Video for Detection
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: "user"
            }, 
            audio: false 
        });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch(e) {
        console.warn("Camera init failed", e);
        safeAlert("Camera access is required for security verification.");
        setStatus('instructions');
        return;
    }

    const candidateName = user.name;
    const jobRole = interview.jobRole;
    const companyName = interview.companyName;
    const numberOfQuestions = interview.questions.length;
    const interviewQuestionsList = interview.questions.map((q, i) => `${i+1}. ${q.text}`).join('\n');
    const timeframe = "the next few days";

    const baseSystemPrompt = `# AI Voice Interview Agent Prompt

You are a professional AI interview agent conducting a voice interview for {{JOB_ROLE}}. Your goal is to create a natural, conversational interview experience while gathering meaningful responses from the candidate.

## Interview Structure

### Phase 1: Introduction & Warm-up (1-2 minutes)
- Greet the candidate warmly and professionally
- Introduce yourself as the AI interview agent for {{COMPANY_NAME}} (if provided, otherwise skip)
- Briefly explain the interview process: "I'll be asking you some questions about your experience and qualifications. Feel free to take your time with your responses."
- Ask for basic information:"
  - "And where are you currently located?"
  - Optional ice-breaker: "How are you doing today?"

### Phase 2: Main Interview Questions
You will ask {{NUMBER_OF_QUESTIONS}} questions provided by the recruiter. These questions are:

{{INTERVIEW_QUESTIONS}}

**Important Guidelines:**
- Ask ONE question at a time
- Listen actively to the candidate's response
- Feel free to rephrase questions naturally if the candidate seems confused
- Ask relevant follow-up questions based on their experience, such as:
  - "Can you tell me more about that?"
  - "What was the outcome of that situation?"
  - "How did you handle [specific challenge they mentioned]?"
  - "What did you learn from that experience?"
- Keep follow-ups relevant and brief (1-2 follow-ups per main question maximum)
- If a candidate's answer is too brief or vague, gently probe: "Could you elaborate on that a bit more?"
- Maintain a conversational, encouraging tone throughout

### Phase 3: Closing
- Thank the candidate for their time
- Let them know: "That concludes our interview questions. Is there anything else you'd like to add or any questions you have about the role?"
- Provide next steps: "Thank you {{CANDIDATE_NAME}}. Your responses have been recorded and the hiring team will review them shortly. You should hear back within [timeframe if provided, otherwise say 'the next few days'].\"
- End warmly: "Best of luck, and have a great day!"

## Conversation Guidelines

**Tone & Style:**
- Professional yet friendly and approachable
- Conversational, not robotic
- Encouraging and supportive
- Patient and clear

**Do:**
- Acknowledge good answers with brief affirmations ("That's interesting", "I see", "Great")
- Allow natural pauses for the candidate to think
- Adapt your phrasing based on the candidate's communication style
- Keep the conversation flowing naturally

**Don't:**
- Rush the candidate
- Ask multiple questions at once
- Make evaluative comments about their answers
- Go off-topic or ask questions outside the provided list (except for relevant follow-ups)
- Interrupt the candidate

## Technical Instructions

**Call Ending:**
When the interview is complete (all questions asked and closing done), OR if the candidate explicitly requests to end the interview early, use the \`end_call\` tool to terminate the session.

Use \`end_call\` when:
- All {{NUMBER_OF_QUESTIONS}} have been asked and answered
- Closing remarks are complete
- Candidate requests to end the call
- Candidate is unresponsive for an extended period

**Response Recording:**
All candidate responses are automatically recorded. Ensure you clearly distinguish between questions by maintaining proper pacing and structure.

---

## Active Variables for This Interview

- **Candidate Name:** {{CANDIDATE_NAME}}
- **Job Role:** {{JOB_ROLE}}
- **Number of Questions:** {{NUMBER_OF_QUESTIONS}}
- **Company Name:** {{COMPANY_NAME}} (optional)
- **Expected Next Steps Timeframe:** {{TIMEFRAME}} (optional)

---

## Example Interview Flow

**Agent:** "Hello! Thanks for joining today. I'm the AI interview agent, and I'll be conducting your interview for the {{JOB_ROLE}} position. This should take about 15-20 minutes. I'll ask you some questions about your experience, and feel free to take your time with your answers. Sound good?"

**Agent:** "Great! Let's start with some basics. Could you please confirm your full name for me?"

*[Candidate responds]*

**Agent:** "Perfect, thank you {{CANDIDATE_NAME}}. And where are you currently located?"

*[Candidate responds]*

**Agent:** "Wonderful. Let's dive into the interview questions. [First question from {{INTERVIEW_QUESTIONS}}]"

*[Continue with main questions and follow-ups]*

**Agent:** "That covers all my questions. Thank you so much for your thoughtful responses, {{CANDIDATE_NAME}}. Before we wrap up, is there anything else you'd like to add or any questions about the role?"

*[Candidate responds or declines]*


*[Use end_call tool]*

---`;

    const injectedSystemPrompt = baseSystemPrompt
        .replace(/{{CANDIDATE_NAME}}/g, candidateName)
        .replace(/{{JOB_ROLE}}/g, jobRole)
        .replace(/{{COMPANY_NAME}}/g, companyName)
        .replace(/{{NUMBER_OF_QUESTIONS}}/g, numberOfQuestions.toString())
        .replace(/{{INTERVIEW_QUESTIONS}}/g, interviewQuestionsList)
        .replace(/{{TIMEFRAME}}/g, timeframe);

    const firstMessage = `Hello ${candidateName} , shall we start ?`;
    const endCallMessage = `Thank you for your time today. Your interview has been recorded and the hiring team will review it shortly. You should hear back soon. Best of luck, ${candidateName}, and have a great day`;

    const assistantConfig = {
        name: "AI Interviewr FYP",
        voice: {
            model: "eleven_turbo_v2_5",
            voiceId: "uYXf8XasLslADfZ2MB4u",
            provider: "11labs",
            stability: 0.5,
            similarityBoost: 0.9
        },
        model: {
            model: "gpt-4-turbo", // Mapped gpt-4.1 to standard turbo to ensure functionality
            messages: [{ role: "system", content: injectedSystemPrompt }],
            provider: "openai",
            temperature: 0.7
        },
        firstMessage: firstMessage,
        endCallFunctionEnabled: true,
        endCallMessage: endCallMessage,
        transcriber: {
            model: "nova-3",
            language: "en",
            provider: "deepgram",
            endpointing: 150
        },
        clientMessages: [
            "conversation-update",
            "function-call",
            "hang",
            "model-output",
            "speech-update",
            "status-update",
            "transfer-update",
            "transcript",
            "tool-calls",
            "user-interrupted",
            "voice-input",
            "workflow.node.started",
            "assistant.started"
        ],
        serverMessages: [
            "conversation-update",
            "end-of-call-report",
            "function-call",
            "hang",
            "speech-update",
            "status-update",
            "tool-calls",
            "transfer-destination-request",
            "handoff-destination-request",
            "user-interrupted",
            "assistant.started"
        ],
        endCallPhrases: [
            "goodbye",
            "talk to you soon"
        ],
        hipaaEnabled: false,
        maxDurationSeconds: 3711,
        backgroundDenoisingEnabled: true,
        artifactPlan: {
            videoRecordingEnabled: true
        },
        startSpeakingPlan: {
            waitSeconds: 0.6,
            smartEndpointingEnabled: "livekit",
            smartEndpointingPlan: {
                provider: "vapi"
            }
        },
        stopSpeakingPlan: {
            numWords: 1
        },
        compliancePlan: {
            hipaaEnabled: false,
            pciEnabled: false
        }
    };

    try {
        await vapiRef.current.start(assistantConfig);
    } catch (e) {
        console.error("Vapi Start Failed", e);
        alert("Failed to connect to AI server. Please retry.");
        setStatus('instructions');
    }
  };

  const handleManualEnd = () => {
      // Immediate UI response
      finishSession('completed');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER ---
  
  if (status === 'loading' || !interview || !session) {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#070A13] text-white font-sans relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0D9488]/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="w-12 h-12 border-4 border-[#0D9488]/20 border-t-[#0D9488] rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(13,148,136,0.3)]"></div>
            <p className="text-[10px] font-bold text-[#0D9488] tracking-[0.25em] uppercase">Initializing Secure Environment...</p>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#070A13] text-white relative overflow-hidden font-sans selection:bg-transparent">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0D9488]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* --- INSTRUCTIONS --- */}
      {status === 'instructions' && (
        <div className="flex flex-col items-center justify-center h-full p-6 relative z-20 font-sans">
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#0D9488]/10 to-transparent pointer-events-none"></div>
            
            {/* Elegant instructions Back Button */}
            <div className="absolute top-6 left-6 z-30">
               <BackButton onClick={onBack} label="Back to Dashboard" />
            </div>

            <div className="max-w-md w-full text-center space-y-6 bg-[#0E1524]/80 backdrop-blur-xl p-8 rounded-[28px] border border-white/5 animate-in zoom-in-95 duration-500 mx-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              
              <div className="w-14 h-14 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center border border-[#0D9488]/20 mx-auto shadow-inner">
                <svg className="w-6 h-6 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">AI Assistant Security Portal</h1>
                <p className="text-xs text-white/50 leading-relaxed">
                  Before we initiate the voice call, please review the security checklist.
                </p>
              </div>

              <div className="grid gap-3 text-left">
                  <div className="bg-[#121B2D]/80 p-4 rounded-xl border border-white/5 flex gap-3.5 items-center">
                      <div className="w-5 h-5 rounded-full bg-[#0D9488]/20 text-[#0D9488] flex items-center justify-center text-[10px] font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-white">Real-Time Proctored Session</p>
                        <p className="text-[10px] text-white/40">Face, gaze, and secondary device detection are active.</p>
                      </div>
                  </div>
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 flex gap-3.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mt-0.5 text-[10px] font-bold">!</div>
                      <div>
                          <p className="text-xs font-bold text-white mb-0.5">Integrity & Focus Rules</p>
                          <p className="text-[10px] text-white/40 leading-tight">Exiting frame or using secondary devices will terminate the session immediately.</p>
                      </div>
                  </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-12 text-xs uppercase tracking-widest bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-[0_4px_20px_rgba(13,148,136,0.3)] rounded-[16px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" 
                onClick={startCall}
              >
                Enter Interview Room
              </Button>
            </div>
        </div>
      )}

      {/* --- LIVE INTERVIEW --- */}
      {(status === 'connecting' || status === 'live') && (
        <div className="absolute inset-0 z-0 bg-[#070A13] flex flex-col font-sans">
          
          {/* CONNECTING OVERLAY */}
          {status === 'connecting' && (
              <div className="absolute inset-0 z-50 bg-[#070A13]/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                  <div className="relative">
                     <div className="w-24 h-24 rounded-full border-4 border-[#0D9488]/10 border-t-[#0D9488] animate-spin shadow-[0_0_30px_rgba(13,148,136,0.2)]"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-[#0D9488] rounded-full animate-ping"></div>
                     </div>
                  </div>
                  <div className="text-center space-y-2">
                      <h2 className="text-lg font-bold text-white tracking-wider uppercase">Calibrating Secure Room</h2>
                      <p className="text-xs text-white/40">Linking with dynamic conversational AI...</p>
                  </div>
              </div>
          )}

          {/* WARNING OVERLAY */}
          {faceWarning && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-red-600/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(220,38,38,0.4)] border border-red-500/20 animate-bounce flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-xs tracking-wider uppercase">{faceWarning}</span>
              </div>
          )}

          {/* FUTURISTIC TOP HEADER */}
          <header className="h-20 w-full bg-gradient-to-b from-[#070A13] to-transparent flex items-center justify-between px-8 relative z-20">
             <div className="flex items-center gap-3">
                <BackButton onClick={() => setShowConfirmLeave(true)} label="Exit Session" />
                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                <div className="w-3 h-3 rounded-full bg-[#0D9488] animate-pulse shadow-[0_0_10px_#0D9488]"></div>
                <div>
                   <h2 className="text-xs font-bold text-white/90 tracking-widest uppercase">Secure Portal • Live Session</h2>
                   <p className="text-[9px] font-bold text-[#0D9488] tracking-widest uppercase mt-0.5">{interview.jobRole}</p>
                </div>
             </div>
             
             {/* Timer HUD */}
             <div className="bg-[#121B2D]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 shadow-md flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-white/80">
                   {status === 'connecting' ? 'INITIALIZING' : `REC • ${formatTime(timeElapsed)}`}
                </span>
             </div>
          </header>

          {/* MAIN CONTENT AREA: TWO PANELS (AI INTERVIEWER VS SECURITY CAMERA MONITOR) */}
          <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 pb-32 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center z-10">
             
             {/* LEFT PANEL (7 cols): AI Hologram Visualizer */}
             <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#0C1222]/40 backdrop-blur-md rounded-[32px] border border-white/5 p-12 h-full min-h-[350px] relative overflow-hidden group shadow-2xl">
                 <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none"></div>
                 
                 {/* Visualizer Module */}
                 <div className="relative flex flex-col items-center justify-center">
                     {/* Dynamic Concentric Glow Rings */}
                     <div 
                        className="absolute w-52 h-52 rounded-full border border-[#0D9488]/10 transition-transform duration-200"
                        style={{ transform: `scale(${1 + volumeLevel * 0.4})`, opacity: 0.15 + volumeLevel * 0.5 }}
                     ></div>
                     <div 
                        className="absolute w-44 h-44 rounded-full border border-[#0D9488]/20 transition-transform duration-150"
                        style={{ transform: `scale(${1 + volumeLevel * 0.2})`, opacity: 0.3 + volumeLevel * 0.5 }}
                     ></div>

                     {/* Main Core Bubble */}
                     <div 
                        className="w-36 h-36 rounded-full bg-[#121B2D] border-2 border-white/10 flex items-center justify-center transition-all duration-100 shadow-[0_0_80px_rgba(13,148,136,0.1)] relative z-10"
                        style={{ 
                          borderColor: volumeLevel > 0.05 ? '#0D9488' : 'rgba(255,255,255,0.1)',
                          boxShadow: volumeLevel > 0.05 
                            ? `0 0 50px rgba(13,148,136, ${0.1 + volumeLevel * 0.8})` 
                            : '0 0 30px rgba(0,0,0,0.5)'
                        }}
                     >
                         {/* Dynamic Wave Bars inside Core */}
                         <div className="flex gap-1.5 items-center justify-center h-16 w-24">
                             {[...Array(7)].map((_, i) => (
                                 <div 
                                     key={i} 
                                     className="w-1.5 rounded-full transition-all duration-75 shadow-[0_0_10px_#0D9488]" 
                                     style={{ 
                                       backgroundColor: volumeLevel > 0.05 ? '#0D9488' : 'rgba(255,255,255,0.3)',
                                       height: Math.max(8, volumeLevel * 90 * (Math.sin(i * 0.5) + 0.8)) + 'px' 
                                     }}
                                 ></div>
                             ))}
                         </div>
                     </div>

                     <div className="absolute -bottom-8 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase">
                           {volumeLevel > 0.05 ? 'AI AGENT SPEAKING' : 'AI AGENT LISTENING'}
                        </span>
                     </div>
                 </div>
             </div>

             {/* RIGHT PANEL (5 cols): Holographic Security Monitor with Camera Feed */}
             <div className="lg:col-span-5 flex flex-col gap-5 h-full justify-center">
                 
                 {/* Glass-Morphic Camera Panel */}
                 <div className="bg-[#0C1222]/80 backdrop-blur-md rounded-[32px] border border-white/5 p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0D9488]/30 rounded-tl-xl pointer-events-none"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0D9488]/30 rounded-tr-xl pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0D9488]/30 rounded-bl-xl pointer-events-none"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0D9488]/30 rounded-br-xl pointer-events-none"></div>
                     
                     <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">CANDIDATE SECURE STREAM</span>
                         <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#10B981]"></span>
                             <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase">PROCTORED</span>
                         </div>
                     </div>

                     {/* Camera Container */}
                     <div className="w-full aspect-[4/3] bg-[#070A13] rounded-2xl border border-white/5 overflow-hidden shadow-inner relative group">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                        
                        {/* HUD overlays */}
                        <div className="absolute bottom-3 left-3 flex gap-2">
                            <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 border border-white/5">
                                <div className={`w-1.5 h-1.5 rounded-full ${faceCount === 1 ? 'bg-[#0D9488] shadow-[0_0_8px_#0D9488]' : 'bg-red-500 animate-pulse'}`}></div>
                                {faceCount === 0 ? 'NO FACE DETECTED' : faceCount > 1 ? 'MULTI-FACE WARNING' : 'FACE ENROLLED'}
                            </div>
                        </div>
                     </div>

                     {/* Angle Bypass controls */}
                     <div className="pt-2">
                        <button
                           onClick={() => setCameraAtAngle(prev => !prev)}
                           className={`w-full py-3 px-4 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                             cameraAtAngle 
                               ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                               : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                           }`}
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                           </svg>
                           {cameraAtAngle ? 'Off-Angle Compensation Enabled' : 'My camera is at an angle'}
                        </button>
                     </div>
                 </div>

             </div>
          </div>
          
          {/* FLOATING ACTION HUD BAR */}
          <div className="absolute bottom-0 w-full z-20 p-8 flex flex-col items-center bg-gradient-to-t from-[#070A13] via-[#070A13]/90 to-transparent">
              <Button 
                 onClick={handleManualEnd}
                 disabled={isSubmitting}
                 className={`w-full max-w-sm h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border ${
                   isSubmitting 
                     ? 'bg-red-900/40 text-red-400 border-red-900/50 cursor-not-allowed scale-95 opacity-70' 
                     : 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_35px_rgba(220,38,38,0.3)] hover:shadow-[0_10px_45px_rgba(220,38,38,0.5)] border-red-500/30'
                 }`}
              >
                 {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                    <div className="w-3.5 h-3.5 bg-white rounded-sm shadow-md animate-pulse"></div>
                 )}
                 <span className="tracking-widest text-xs font-black uppercase">
                   {isSubmitting ? 'FINALIZING INTERVIEW...' : 'END INTERVIEW'}
                 </span>
              </Button>
          </div>
        </div>
      )}

      {showConfirmLeave && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#0E1524] border border-white/10 rounded-[28px] max-w-sm w-full p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Leave Interview?</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Going back will end or interrupt your interview. Any unsaved progress may be lost.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLeave(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmLeave(false);
                  finishSession('completed');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-[0_4px_20px_rgba(220,38,38,0.2)] transition-all cursor-pointer"
              >
                Leave Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DATA SAVING OVERLAY --- */}
      {status === 'saving' && (
        <div className="fixed inset-0 bg-[#070A13] flex flex-col items-center justify-center z-50 p-6 font-sans">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0D9488]/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-[#0D9488]/20 border-t-[#0D9488] rounded-full animate-spin shadow-[0_0_20px_rgba(13,148,136,0.2)]"></div>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wider uppercase mb-2">Finalizing Interview...</h2>
          <p className="text-xs text-[#0D9488] font-semibold animate-pulse tracking-wide mt-1 max-w-sm text-center">{savingProgress}</p>
        </div>
      )}

      {/* --- SUBMISSION SUCCESS SCREEN --- */}
      {status === 'submission-success' && (
        <div className="fixed inset-0 bg-[#070A13] flex flex-col items-center justify-center z-50 p-6 font-sans">
          <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#0D9488]/10 to-transparent pointer-events-none"></div>
          <div className="max-w-md w-full text-center space-y-6 bg-[#0E1524]/90 backdrop-blur-xl p-8 rounded-[28px] border border-[#0D9488]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="w-14 h-14 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center border border-[#0D9488]/20 mx-auto shadow-inner">
              <svg className="w-6 h-6 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Interview Complete!</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Thank you for completing your assessment for the <span className="text-[#0D9488] font-bold">{interview?.jobRole}</span> role.
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Your responses have been securely stored. The hiring team has been notified and will review your evaluation profile shortly.
              </p>
            </div>
            <button
              onClick={() => {
                onComplete();
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-xs font-bold text-white shadow-[0_4px_20px_rgba(13,148,136,0.2)] transition-all cursor-pointer uppercase tracking-wider"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* --- SUBMISSION FAILED / RETRY SCREEN --- */}
      {status === 'submission-failed' && (
        <div className="fixed inset-0 bg-[#070A13] flex flex-col items-center justify-center z-50 p-6 font-sans">
          <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none"></div>
          <div className="max-w-md w-full text-center space-y-6 bg-[#0E1524]/90 backdrop-blur-xl p-8 rounded-[28px] border border-red-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mx-auto shadow-inner">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Submission Failed</h2>
              <p className="text-xs text-white/60 leading-relaxed">
                We encountered a network or database issue while saving your interview.
              </p>
              {saveError && (
                <div className="bg-red-950/40 border border-red-900/30 p-3 rounded-lg text-left mt-2">
                  <p className="font-mono text-[9px] text-red-400 break-words">{saveError}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  isTerminatingRef.current = false; // Allow retrying
                  if (retrySaveRef.current) retrySaveRef.current();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-xs font-bold text-white shadow-[0_4px_20px_rgba(13,148,136,0.2)] transition-all cursor-pointer"
              >
                Retry Submission
              </button>
              <button
                onClick={() => {
                  onComplete();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white/60 transition-all cursor-pointer"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};