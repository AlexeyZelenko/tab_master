# How to Use AI Features in Keep Tabs

This guide explains how to enable and use the AI-powered features in the Keep Tabs extension to automatically name and describe your collections.

---

### What is the AI Feature?

The AI feature uses a powerful language model (OpenAI's GPT) to analyze the titles of your currently open tabs. Based on this analysis, it intelligently suggests a short, relevant name and a one-sentence description for your new collection.

**The goal is to save you time and help you maintain a well-organized workspace without having to manually name every collection.**

---

### Step 1: Get an OpenAI API Key

To use the AI features, you need your own API key from OpenAI. This ensures that all requests are private and secure under your own account.

1.  **Create an Account**: Go to [platform.openai.com](https://platform.openai.com/) and sign up for an account if you don't have one.
2.  **Go to API Keys**: Navigate to the [API keys section](https://platform.openai.com/api-keys) in your user dashboard.
3.  **Create a New Secret Key**:
    *   Click the **"+ Create new secret key"** button.
    *   Give it a recognizable name (e.g., "Keep Tabs Extension").
    *   Click "Create secret key".
4.  **Copy Your Key**: Your new API key will be displayed. **Copy it immediately and save it somewhere safe.** You will not be able to see the full key again after you close the window. The key will start with `sk-...`.

> **Note on Billing**: OpenAI may require you to set up a paid account or add a credit card to use the API, even if your usage is very low. Please refer to OpenAI's current pricing and free tier policies.

---

### Step 2: Enable AI Features in the Extension

Once you have your API key, you can activate the feature inside the extension.

1.  **Open Extension Settings**: Click the **Settings icon (⚙️)** in the top-left corner of the extension's sidebar.
2.  **Enable AI Features**: In the settings dialog, check the box next to **"Enable AI Features"**.
3.  **Enter Your API Key**: A password field will appear. Paste your secret API key (the one starting with `sk-...`) into this field.
4.  **Save Your Settings**: Click the **"Save"** button.

Your API key is stored securely and locally on your computer using `chrome.storage.local`. It is never sent to any server other than OpenAI's.

---

### Step 3: Use the AI Assistant

Now you're ready to use the feature!

1.  **Open the Save Dialog**: Click the **Save button (+)** next to "This browser" to save your current tabs.
2.  **Click the AI Button**: In the "Save Current Tabs" dialog, you will now see a purple button labeled **"✨ Suggest with AI"**.
3.  **Get Your Suggestion**: Click this button. It will show a "Thinking..." state for a few seconds.
4.  **Review and Save**: The "Collection name" and "Description" fields will be automatically filled with the AI's suggestion. You can either accept it as is or edit it before clicking "Save".

That's it! You can now create smartly-named collections with a single click. 