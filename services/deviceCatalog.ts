import { DeviceSpec } from '../types';

export const DEVICE_CATALOG: DeviceSpec[] = [
  {
    id: 'cam_360_ceiling',
    name: 'OmniView 360 Ceiling Cam',
    type: 'camera',
    color: '#3b82f6', // blue-500
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    specs: {
      description: '5MP Fisheye, Ceiling Mount, No blind spots.',
      viewAngle: 360,
      range: 8,
      mountType: 'ceiling',
      resolution: '5MP'
    }
  },
  {
    id: 'cam_120_wall',
    name: 'Sentry Wall Cam',
    type: 'camera',
    color: '#0ea5e9', // sky-500
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    specs: {
      description: '2MP, 120-degree FOV, Night Vision.',
      viewAngle: 120,
      range: 12,
      mountType: 'wall',
      resolution: '2MP'
    }
  },
  {
    id: 'sensor_door',
    name: 'Door/Window Contact',
    type: 'sensor',
    color: '#f59e0b', // amber-500
    icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M4 6v12h6V6H4z M14 6v12h6V6h-6z M16 12h2',
    specs: {
      description: 'Magnetic contact sensor for entry points.',
      range: 0,
      mountType: 'surface'
    }
  },
  {
    id: 'sensor_motion',
    name: 'PIR Motion Detector',
    type: 'detector',
    color: '#ef4444', // red-500
    icon: 'M12 2a10 10 0 00-7.75 16.36l1.52-1.52a8 8 0 1112.46 0l1.52 1.52A10 10 0 0012 2z M12 6a4 4 0 100 8 4 4 0 000-8z',
    specs: {
      description: 'Passive Infrared, ignore pets < 20kg.',
      viewAngle: 90,
      range: 10,
      mountType: 'wall'
    }
  },
  {
    id: 'sensor_glass',
    name: 'Glass Break Sensor',
    type: 'detector',
    color: '#8b5cf6', // violet-500
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    specs: {
      description: 'Acoustic glass break detection.',
      range: 6,
      mountType: 'ceiling'
    }
  }
];
