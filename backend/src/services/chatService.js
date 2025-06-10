import graph from "../agent/graph.ts";
class ChatService {
  constructor(dealAgentRepository) {
    this.dealAgentRepository = dealAgentRepository;
  }

  async chat(message, bidderID, productID, auctionID, bidAmount) {
    const config = {
      configurable: {
        thread_id: auctionID,
      },
    };

    try {
      const response = await graph.ainvoke(
        {
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          bidderID,
          auctionID,
          bidAmount,
        },
        config
      );

      return response;
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
