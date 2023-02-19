class MyService {
  async serve(req) {
    const body = `hello: ${req.url}`;
    return {
      status: 200,
      headers: { "Content-Type": "text/plain" },
      body,
    };
  }
}

module.exports = new MyService();
