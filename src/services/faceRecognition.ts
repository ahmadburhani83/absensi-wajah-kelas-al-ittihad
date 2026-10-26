import * as faceapi from '@vladmandic/face-api';
import type { StudentItem, MatchResult, FaceDetectionBox } from '../types';

class FaceRecognitionService {
  private isModelLoaded = false;
  private loadingPromise: Promise<boolean> | null = null;
  // Threshold Euclidean distance: lower = stricter, higher = more lenient.
  // vladmandic / face-api recommends 0.50 - 0.58 for face recognition net.
  public matchThreshold = 0.52;

  /**
   * Load face-api neural net models from local /models folder.
   * Models are self-hosted in public/models for 100% offline & fast loads.
   */
  async loadModels(): Promise<boolean> {
    if (this.isModelLoaded) return true;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const MODEL_URL = '/models';
        console.log('Memuat neural network models dari', MODEL_URL, '...');
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        this.isModelLoaded = true;
        console.log('Model Face Recognition berhasil dimuat!');
        return true;
      } catch (err) {
        console.error('Gagal memuat face recognition models:', err);
        this.loadingPromise = null;
        return false;
      }
    })();

    return this.loadingPromise;
  }

  isReady(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Extract face descriptor from HTMLVideoElement or HTMLCanvasElement.
   * CRITICAL PRIVACY: Returns ONLY a 128-float numerical vector.
   * NO photo or image is stored!
   */
  async extractDescriptor(
    input: HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ descriptor: number[]; box: FaceDetectionBox } | null> {
    if (!this.isModelLoaded) {
      const ok = await this.loadModels();
      if (!ok) return null;
    }

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      });

      const detection = await faceapi
        .detectSingleFace(input, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;

      const { box } = detection.detection;
      return {
        descriptor: Array.from(detection.descriptor),
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
      };
    } catch (err) {
      console.error('Error saat ekstraksi descriptor wajah:', err);
      return null;
    }
  }

  /**
   * Detect all faces in current video frame and match each with registered students.
   */
  async detectAndMatch(
    video: HTMLVideoElement,
    enrolledStudents: StudentItem[]
  ): Promise<MatchResult[]> {
    if (!this.isModelLoaded || !video || video.paused || video.ended) {
      return [];
    }

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      });

      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) return [];

      const results: MatchResult[] = [];

      for (const detection of detections) {
        const liveDesc = Array.from(detection.descriptor);
        const { box } = detection.detection;
        const boxData: FaceDetectionBox = {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };

        let bestStudent: StudentItem | null = null;
        let minDistance = 999;

        for (const student of enrolledStudents) {
          if (!student.face_descriptor || student.face_descriptor.length === 0) continue;

          const dist = this.calculateEuclideanDistance(liveDesc, student.face_descriptor);
          if (dist < minDistance) {
            minDistance = dist;
            bestStudent = student;
          }
        }

        if (bestStudent && minDistance <= this.matchThreshold) {
          // Calculate confidence: lower distance = higher confidence
          // 0.0 distance = 100%, matchThreshold distance = ~75%
          const confidence = Math.max(
            0,
            Math.min(100, Math.round((1 - minDistance / (this.matchThreshold * 1.5)) * 100))
          );

          results.push({
            student: bestStudent,
            distance: minDistance,
            confidence,
            box: boxData,
          });
        }
      }

      return results;
    } catch (err) {
      console.error('Error dalam deteksi live face:', err);
      return [];
    }
  }

  /**
   * Euclidean Distance formula: sqrt( sum( (A_i - B_i)^2 ) )
   */
  calculateEuclideanDistance(descA: number[], descB: number[]): number {
    if (descA.length !== descB.length) return 999;
    let sum = 0;
    for (let i = 0; i < descA.length; i++) {
      const diff = descA[i] - descB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}

export const faceRecognitionService = new FaceRecognitionService();
