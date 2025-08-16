import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

async function testDocumentParsing() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('🔑 API Key loaded successfully');
  console.log('🧪 Testing Document Parsing with Gemini API...\n');
  
  // Test 1: Without document content (current state)
  console.log('📋 TEST 1: Without Document Content (Current State)');
  console.log('=' .repeat(60));
  
  const testWithoutDoc = {
    contents: [{
      role: "user",
      parts: [{
        text: `You are Alex, an HR Assistant for Duolingo. 

COMPANY KNOWLEDGE BASE:
Company: Duolingo
Size: 1000+
Industry: technology

AVAILABLE DOCUMENTS: The_Duolingo_Handbook.pdf

KEY DOCUMENT CONTENT:
The_Duolingo_Handbook.pdf: [File type (application/pdf) not readable in browser]

User message: What specific policies are mentioned in the company handbook?`
      }]
    }]
  };
  
  try {
    const response1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testWithoutDoc)
      }
    );
    
    if (response1.ok) {
      const data1 = await response1.json();
      const responseText1 = data1.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Response:', responseText1);
      console.log(`Tokens: ${data1.usageMetadata?.totalTokenCount || 'N/A'}\n`);
    }
  } catch (error) {
    console.error('Error in test 1:', error.message);
  }
  
  // Test 2: With simulated parsed document content
  console.log('📋 TEST 2: With Parsed Document Content (Simulated)');
  console.log('=' .repeat(60));
  
  const testWithDoc = {
    contents: [{
      role: "user",
      parts: [{
        text: `You are Alex, an HR Assistant for Duolingo. 

COMPANY KNOWLEDGE BASE:
Company: Duolingo
Size: 1000+
Industry: technology

AVAILABLE DOCUMENTS: The_Duolingo_Handbook.pdf

KEY DOCUMENT CONTENT:
The_Duolingo_Handbook.pdf contains the following policies:

1. WORK SCHEDULE: Standard work hours are 9 AM to 5 PM, with flexible start times between 8 AM and 10 AM. Core collaboration hours are 10 AM to 4 PM.

2. REMOTE WORK: Employees can work remotely up to 3 days per week. Remote work requests must be approved by managers.

3. TIME OFF: 20 PTO days per year, plus 10 company holidays. Sick leave is unlimited with manager approval.

4. BENEFITS: Health, dental, and vision insurance. 401(k) with 4% company match. Stock options after 1 year.

5. DRESS CODE: Business casual. No formal dress code requirements.

6. MEETING POLICY: No meetings on Fridays. All meetings should have clear agendas and end on time.

User message: What specific policies are mentioned in the company handbook?`
      }]
    }]
  };
  
  try {
    const response2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testWithDoc)
      }
    );
    
    if (response2.ok) {
      const data2 = await response2.json();
      const responseText2 = data2.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Response:', responseText2);
      console.log(`Tokens: ${data2.usageMetadata?.totalTokenCount || 'N/A'}\n`);
    }
  } catch (error) {
    console.error('Error in test 2:', error.message);
  }
  
  // Test 3: Test with a specific policy question
  console.log('📋 TEST 3: Specific Policy Question with Document Content');
  console.log('=' .repeat(60));
  
  const testSpecificQuestion = {
    contents: [{
      role: "user",
      parts: [{
        text: `You are Alex, an HR Assistant for Duolingo. 

COMPANY KNOWLEDGE BASE:
Company: Duolingo
Size: 1000+
Industry: technology

AVAILABLE DOCUMENTS: The_Duolingo_Handbook.pdf

KEY DOCUMENT CONTENT:
The_Duolingo_Handbook.pdf contains the following policies:

1. WORK SCHEDULE: Standard work hours are 9 AM to 5 PM, with flexible start times between 8 AM and 10 AM. Core collaboration hours are 10 AM to 4 PM.

2. REMOTE WORK: Employees can work remotely up to 3 days per week. Remote work requests must be approved by managers.

3. TIME OFF: 20 PTO days per year, plus 10 company holidays. Sick leave is unlimited with manager approval.

4. BENEFITS: Health, dental, and vision insurance. 401(k) with 4% company match. Stock options after 1 year.

5. DRESS CODE: Business casual. No formal dress code requirements.

6. MEETING POLICY: No meetings on Fridays. All meetings should have clear agendas and end on time.

User message: How many PTO days do I get per year and what is the meeting policy?`
      }]
    }]
  };
  
  try {
    const response3 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSpecificQuestion)
      }
    );
    
    if (response3.ok) {
      const data3 = await response3.json();
      const responseText3 = data3.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Response:', responseText3);
      console.log(`Tokens: ${data3.usageMetadata?.totalTokenCount || 'N/A'}\n`);
    }
  } catch (error) {
    console.error('Error in test 3:', error.message);
  }
  
  console.log('🎯 ANALYSIS:');
  console.log('=' .repeat(60));
  console.log('• Test 1 shows the current state: agents cannot access document content');
  console.log('• Test 2 shows how agents would respond with parsed document content');
  console.log('• Test 3 shows specific policy questions being answered from document data');
  console.log('\n💡 To fix this, you need to implement proper PDF parsing in your upload system');
}

// Run the test
testDocumentParsing();
