'use server';

/**
 * @fileOverview Recognizes addresses from photos using AI.
 *
 * - recognizeAddressFromPhoto - A function that handles the address recognition process.
 * - RecognizeAddressFromPhotoInput - The input type for the recognizeAddressFromPhoto function.
 * - RecognizeAddressFromPhotoOutput - The return type for the recognizeAddressFromPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeAddressFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an address, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeAddressFromPhotoInput = z.infer<typeof RecognizeAddressFromPhotoInputSchema>;

const RecognizeAddressFromPhotoOutputSchema = z.object({
  address: z.string().describe('The extracted address from the photo.'),
});
export type RecognizeAddressFromPhotoOutput = z.infer<typeof RecognizeAddressFromPhotoOutputSchema>;

export async function recognizeAddressFromPhoto(
  input: RecognizeAddressFromPhotoInput
): Promise<RecognizeAddressFromPhotoOutput> {
  return recognizeAddressFromPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeAddressFromPhotoPrompt',
  input: {schema: RecognizeAddressFromPhotoInputSchema},
  output: {schema: RecognizeAddressFromPhotoOutputSchema},
  prompt: `You are an AI assistant specialized in recognizing addresses from images.

  Extract the address from the following image.  If no address is present return an empty string.

  Image: {{media url=photoDataUri}}`,
});

const recognizeAddressFromPhotoFlow = ai.defineFlow(
  {
    name: 'recognizeAddressFromPhotoFlow',
    inputSchema: RecognizeAddressFromPhotoInputSchema,
    outputSchema: RecognizeAddressFromPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
