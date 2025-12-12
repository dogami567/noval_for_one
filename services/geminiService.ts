export const generateChronicleResponse = async (
  userMessage: string,
  context?: string,
  history?: { role: 'user' | 'assistant'; content: string }[],
  attachments?: Array<
    | { kind: 'image'; filename: string; contentType: string; base64: string }
    | { kind: 'text'; filename: string; contentType: string; text: string }
  >
): Promise<string> => {
  try {
    const body = {
      message: userMessage,
      context,
      history,
      attachments,
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.text || 'Request failed');
    }

    return data?.text || '档案馆暂时无法回应，请稍后再试。';
  } catch (error) {
    console.warn('[chat] client error', error);
    return '档案馆暂时无法回应，请稍后再试。';
  }
};
