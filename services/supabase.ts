
import { createClient } from '@supabase/supabase-js';

// Sanitization utility to strip potential trailing paths like /rest/v1/ from standard Supabase project URL
const sanitizeUrl = (url: string) => {
  if (!url) return url;
  return url.replace(/\/rest\/v1\/?$/, '').trim();
};

// Fallback defaults using your new Supabase database
const defaultUrl = 'https://fblgbrdzufarqpwkbwto.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibGdicmR6dWZhcnFwd2tid3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTQ0ODQsImV4cCI6MjA5ODMzMDQ4NH0._027Xvh4ohNMW6M78jjzgzTL9QOL2-ZUrOoGthGdUk8';

// Check Vite's built-in env loader first, then process.env, then the default fallback
const rawUrl = import.meta.env?.VITE_SUPABASE_URL || 
               (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
               defaultUrl;

const supabaseUrl = sanitizeUrl(rawUrl);

const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                    defaultKey;

export const supabase = createClient(supabaseUrl, supabaseKey.trim());

