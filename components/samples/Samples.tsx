import { useTranslation } from 'next-i18next';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import CopyToClipboardButton from '../shared/CopyToClipboardButton';

const Samples = () => {
  const { t } = useTranslation('common');

  const codeExamples = [
      {
      language: 'TypeScript',
      code: `// OpenAI API example
import { OpenAI } from 'openai';

const client = new OpenAI({
  baseURL: "http://localhost:4002/7c5841e1-698a-404e-9df4-a80302247964/v1",
  apiKey: "N2hmcjFlcGg1cGNoanN0MGZxYTFvbmFhMmY="
});

async function getAssistantReply() {
  const { choices } = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [{
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "What are the earnings of Apple in 2022?"
      }
    ],
    stream: true
  });
  console.log('Assistant:', choices[0].message.content);
}`
    },
    {
      language: 'Python',
      code: `# OpenAI API example
from openai import OpenAI
client = OpenAI(
  base_url = "http://localhost:4002/7c5841e1-698a-404e-9df4-a80302247964/v1", # LangDB API base URL,
  api_key = "N2hmcjFlcGg1cGNoanN0MGZxYTFvbmFhMmY="
)
response = client.chat.completions.create(
  model = "deepseek-chat",
  messages = [{
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "What are the earnings of Apple in 2022?"
    }
  ]
)
print("Assistant:", response.choices[0].message)`
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CodeBracketIcon className="h-5 w-5" />
        <h1 className="text-2xl font-bold">{t('samples')}</h1>
      </div>
      
      {codeExamples.map((example, index) => (
        <div key={index} className="space-y-2">
          <h2 className="text-lg font-semibold">{example.language}</h2>
          <div className="relative">
            <pre className="p-4 bg-gray-100 rounded-md">
              <code>{example.code}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <CopyToClipboardButton value={example.code} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Samples;
