import { useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';

function GeminiAadharExtractor() {
  const [image, setImage] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<{name: string} | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // API key from environment variable
  const API_KEY = import.meta.env.VITE_GEMINI_APIKEY || '';

  function handleOnChoose(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      setImage(imageFile);
      setExtractedData(null);
      setError('');
    }
  }

  async function extractNameWithGemini(text: string) {
    try {
      // Gemini API endpoint
      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
      
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: `
                  You are an AI assistant that extracts information from Aadhaar card text.
                  From the following text extracted from an Aadhaar card, extract ONLY the person's name.
                  Return ONLY a JSON object with a single field "name" containing the full name found.
                  
                  Text from Aadhaar card:
                  ${text}
                `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100
        }
      };
      
      // Make the API request
      const response = await axios.post(
        `${endpoint}?key=${API_KEY}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the text response
      const responseText = response.data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[^}]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as {name: string};
      } else {
        throw new Error("Failed to extract name in JSON format");
      }
    } catch (error) {
      console.error("Error extracting name with Gemini:", error);
      throw error;
    }
  }

  async function handleConvert() {
    if (!image) {
      setError('Please upload an image first');
      return;
    }
    
    try {
      setLoading(true);
      setError('');

      // Step 1: Extract text from image using Tesseract
      const result = await Tesseract.recognize(image, 'eng');
      const extractedText = result.data.text;
      
      // Step 2: Use Gemini to extract only the name
      const nameData = await extractNameWithGemini(extractedText);
      setExtractedData(nameData);
    } catch (err) {
      console.error("Error processing Aadhaar card:", err);
      setError('Failed to extract name from image. Please ensure you uploaded a clear Aadhaar card image.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-white">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-800 dark:text-blue-300">Aadhaar Card Name Extractor</h2>
      
      <div className="mb-5">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          Upload your Aadhaar Card Image:
        </label>
        <input 
          type="file" 
          onChange={handleOnChoose} 
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            dark:file:bg-blue-900 dark:file:text-blue-300
            hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          accept="image/*"
        />
      </div>
      
      {image && (
        <div className="mb-5">
          <div className="mb-3">
            <img 
              src={URL.createObjectURL(image)} 
              alt="Aadhaar preview" 
              className="object-contain w-full rounded border border-gray-200 dark:border-gray-700 h-40"
            />
          </div>
          <button 
            onClick={handleConvert}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium text-white ${loading ? 'bg-blue-300 dark:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'} transition-colors`}
          >
            {loading ? 
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span> : 
              'Extract Name'
            }
          </button>
        </div>
      )}
      
      {error && (
        <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {extractedData && (
        <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-md">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Extracted Name:</h3>
          <div className="text-lg font-medium text-blue-800 dark:text-blue-300">
            {extractedData.name}
          </div>
        </div>
      )}
    </div>
  );
}

export default GeminiAadharExtractor;