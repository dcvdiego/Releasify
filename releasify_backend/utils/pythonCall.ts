import { spawn } from 'child_process';
import path from 'path';

interface PredictionInput {
  dates: string[];
}

interface PredictionOutput {
  predicted_date: string;
  confidence: number;
  model_used: string;
}

export function getPythonPrediction(input: PredictionInput): Promise<PredictionOutput> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'components', 'ai', 'predict_release.py');
    const stringJSON = JSON.stringify(input);

    const pyprog = spawn('python3', [scriptPath, stringJSON]);

    let stdout = '';
    let stderr = '';

    pyprog.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    pyprog.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    pyprog.on('close', (code: number) => {
      if (code !== 0) {
        console.error('Python script error:', stderr);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse Python output:', stdout);
        reject(new Error(`Failed to parse prediction result: ${error}`));
      }
    });

    pyprog.on('error', (error: Error) => {
      console.error('Failed to spawn Python process:', error);
      reject(new Error(`Failed to run prediction: ${error.message}`));
    });
  });
}
