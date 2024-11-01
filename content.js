chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPrompt") {
    const editorDiv = document.querySelector('div.ql-editor.textarea');
    if (editorDiv) {
      const promptParagraph = editorDiv.querySelector('p');
      if (promptParagraph && promptParagraph.textContent.trim()) {
        sendResponse({prompt: promptParagraph.textContent.trim()});
      } else {
        sendResponse({error: "Prompt is empty"});
      }
    } else {
      sendResponse({error: "Prompt element not found"});
    }
  }
  return true;
});