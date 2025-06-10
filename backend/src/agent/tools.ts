import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const registerOffer = tool(
  ({ bidAmount, auctionID, userID }) => {
    return `Offer registered for auction ${auctionID} with bid amount ${bidAmount} by user ${userID}.`;
  },
  {
    name: "registerOffer",
    description: "Call to register an offer in an auction.",
    schema: z.object({
      bidAmount: z.string().describe("El monto de la oferta."),
      auctionID: z.number().int().describe("ID entero de la subasta."),
      userID: z.number().describe("ID del usuario."),
    }),
  }
);

export const tools = [registerOffer, registerWinningOffer];
export const toolNode = new ToolNode(tools);
