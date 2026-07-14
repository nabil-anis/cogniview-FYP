const fs = require('fs');
const content = fs.readFileSync('pages/interviewee/InterviewRoom.tsx', 'utf8');

const startStr = 'const baseSystemPrompt = `# AI Voice Interview Agent Prompt';
const endStr = 'setStatus(\'instructions\');\n    }\n  };\n\n  const handleManualEnd';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
    
    if (!assistantId) {
        console.error("Vapi Assistant ID is missing in environment variables.");
        alert("Application configuration error. Missing Assistant ID.");
        setStatus('instructions');
        return;
    }

    const assistantOverrides = {
        variableValues: {
            CANDIDATE_NAME: candidateName,
            JOB_ROLE: jobRole,
            COMPANY_NAME: companyName,
            NUMBER_OF_QUESTIONS: numberOfQuestions.toString(),
            INTERVIEW_QUESTIONS: interviewQuestionsList,
            TIMEFRAME: timeframe
        }
    };

    try {
        await vapiRef.current.start(assistantId, assistantOverrides);
    } catch (e) {
        console.error("Vapi Start Failed", e);
        alert("Failed to connect to AI server. Please retry.");
        setStatus('instructions');
    }
  };

  const handleManualEnd`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + endStr.length);
  fs.writeFileSync('pages/interviewee/InterviewRoom.tsx', newContent);
  console.log('Successfully replaced');
} else {
  console.log('Could not find start or end strings');
}
