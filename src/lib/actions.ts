'use server';

import { recognizeAddressFromPhoto as recognizeAddressFromPhotoFlow, type RecognizeAddressFromPhotoInput, type RecognizeAddressFromPhotoOutput } from '@/ai/flows/address-recognition';
import { optimizeRouteWithAI as optimizeRouteWithAIFlow, type OptimizeRouteInput, type OptimizeRouteOutput } from '@/ai/flows/route-optimization';

export async function recognizeAddressAction(input: RecognizeAddressFromPhotoInput): Promise<RecognizeAddressFromPhotoOutput> {
  try {
    return await recognizeAddressFromPhotoFlow(input);
  } catch (error) {
    console.error('Error recognizing address:', error);
    throw new Error('Failed to recognize address from photo. Please try again.');
  }
}

export async function optimizeRouteAction(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  if (input.addresses.length < 2) {
    throw new Error('At least two addresses are required to optimize a route.');
  }
  try {
    return await optimizeRouteWithAIFlow(input);
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw new Error('Failed to optimize route. Please try again.');
  }
}

// Helper to convert File to Base64 Data URI (remains a client-side utility, but defined here for context if needed server-side, though typically client calls server action with data URI)
// This function is intended for client-side use before calling the server action.
/*
export const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      return reject(new Error('FileReader is not available in this environment.'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
*/
