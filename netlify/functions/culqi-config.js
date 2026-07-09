exports.handler = async () => {
  const publicKey = process.env.CULQI_PUBLIC_KEY || '';
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey })
  };
};
