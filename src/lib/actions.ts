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
