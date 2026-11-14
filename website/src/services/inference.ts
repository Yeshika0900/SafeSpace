export const INFERENCE = Object.freeze({base:'lite_mobilenet_v2' as const, maxPredictions:20, minScore:0.55, displayCap:8, intervalMs:1200});
export type Observation = {class:string;score:number;bbox:number[]};
export interface ObjectModel { detect(input:HTMLVideoElement,max:number,minScore:number):Promise<Observation[]>; dispose():void; }
export async function loadObjectModel():Promise<ObjectModel> {
  await import('@tensorflow/tfjs');
  const coco = await import('@tensorflow-models/coco-ssd');
  return coco.load({base:INFERENCE.base});
}
