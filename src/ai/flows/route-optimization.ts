'use server';

/**
 * @fileOverview This file contains the Genkit flow for optimizing a route based on a list of addresses.
 *
 * - optimizeRouteWithAI - A function that takes a list of addresses and returns an optimized route.
 * - OptimizeRouteInput - The input type for the optimizeRouteWithAI function.
 * - OptimizeRouteOutput - The return type for the optimizeRouteWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteInputSchema = z.object({
  addresses: z
    .array(z.string())
    .describe('An array of addresses to be optimized in terms of routing distance.'),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

const OptimizeRouteOutputSchema = z.object({
  optimizedRoute: z
    .array(z.string())
    .describe('An array of addresses representing the optimized route.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the optimized route, explaining the order of addresses.'),
});
export type OptimizeRouteOutput = z.infer<typeof OptimizeRouteOutputSchema>;

export async function optimizeRouteWithAI(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const optimizeRoutePrompt = ai.definePrompt({
  name: 'optimizeRoutePrompt',
  input: {schema: OptimizeRouteInputSchema},
  output: {schema: OptimizeRouteOutputSchema},
  prompt: `You are a route optimization expert. Given a list of addresses, you will determine the most efficient route to visit each address, minimizing travel distance.

Addresses: {{addresses}}

Consider factors such as distance between addresses, traffic patterns, and road conditions (if available) to create the optimal route. Provide a clear explanation of your reasoning for the chosen route.

Output the optimized route as an ordered list of addresses, followed by a detailed explanation of the factors considered in determining the route. The addresses must be returned in the same format as the input. Do not change the format or spelling of the addresses in any way.

Ensure that the reasoning clearly justifies why this route is the most efficient.
`,
});

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: OptimizeRouteOutputSchema,
  },
  async input => {
    const {output} = await optimizeRoutePrompt(input);
    return output!;
  }
);
