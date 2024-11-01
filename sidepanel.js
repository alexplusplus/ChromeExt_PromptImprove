document.getElementById('improvePrompt').addEventListener('click', async () => {
  try {
    const improvementsDiv = document.getElementById('improvements');
    const loadingDiv = document.getElementById('loading');
    const improveButton = document.getElementById('improvePrompt');
    
    improveButton.disabled = true;
    improvementsDiv.innerHTML = '';

    // Get the current tab
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }

    // Check if we're on the correct page
    const tab = tabs[0];
    if (!tab.url.startsWith('https://gemini.google.com/app')) {
      throw new Error('Please navigate to Gemini chat page first');
    }

    // Try to inject content script again just in case
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('Content script already injected or failed to inject:', e);
    }

    // Get the prompt from the webpage with timeout
    const response = await Promise.race([
      chrome.tabs.sendMessage(tab.id, {action: "getPrompt"}),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for prompt')), 5000)
      )
    ]);

    if (response.error) {
      improvementsDiv.innerHTML = `
        <div class="p-4 bg-red-100 text-red-700 rounded">
          ${response.error}
        </div>`;
      return;
    }

    // Display original prompt and title immediately
    improvementsDiv.innerHTML = `
      <h3 class="text-lg font-semibold mt-1">Original Prompt:</h3>
      <p class="p-2 bg-gray-100 rounded">${response.prompt}</p>
      <h3 class="text-lg font-semibold">Suggested Improvements:</h3>
    `;
    
    // Show loading below the title
    loadingDiv.style.display = 'block';

    // Get the AI session
    const session = await ai.languageModel.create();
    
    const request_embed_ai = "Act as a helpful expert in prompt engineering who should help me to improve a draft of prompt that I have written. Review this draft provided below from beginning to end and provide a list of at least three improvements for it. Each of your suggestions should be formulated in one or two phrases. Respond only in English. Output should be formatted as a string in which individual suggestions are separated from one another by a vertical line |. It must not contain draft of prompt and the word output. Instead of making some vague irrelevant suggestions like 'Use a more concise question format' try to come up with insightful ideas that will take into account the major weaknesses of the original draft, allowing to write an effective prompt and follow this pattern: ### Draft of prompt: What can I visit in London? Output: 'The original prompt is too broad.  Please add context like age group or interests.|The original prompt doesn't specify the desired scope. Adding constraints like duration or areas helps narrow down the search results and make the answer more manageable.|Instead of a general question, be more specific about your motivation.' Draft of prompt: " + response.prompt + " Output: ";
    
    // Get improvements from AI
    const list_of_improvements = await session.prompt(request_embed_ai);
    
    // Split improvements by | and create HTML list items, filtering out empty/short items
    const improvements = list_of_improvements
      .split('|')
      .map(item => item.trim())
      .filter(item => item.length >= 3) // Only keep items with 3 or more characters
      .map(item => `<li class="mb-2">${item}</li>`)
      .join('');

    // Append the improvements as an unordered list
    improvementsDiv.innerHTML += `
      <ul class="list-disc pl-5 space-y-2 bg-blue-50 rounded p-1">
        ${improvements}
      </ul>
    `;

    // Log the improvements to console
    console.log(list_of_improvements);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('improvements').innerHTML = `
      <div class="p-4 bg-red-100 text-red-700 rounded">
        ${error.message || 'An unexpected error occurred'}
      </div>
    `;
  } finally {
    // Hide loading state
    document.getElementById('loading').style.display = 'none';
    document.getElementById('improvePrompt').disabled = false;
  }
});