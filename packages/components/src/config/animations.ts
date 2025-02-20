import { keyframes } from 'styled-components';
import colors from './colors';

export const SPIN = keyframes`
    0% { 
        transform: rotate(0deg); 
    }
    100% { 
        transform: rotate(360deg);
    }
`;

export const DASH = keyframes`
    0% {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
    }
    50% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -35;
    }
    100% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -124;
    }
`;

export const SLIDE_UP = keyframes`
    0% {
        transform: translateY(150%);
    }
    100% {
        transform: translateY(0%);
    }
`;

export const SLIDE_DOWN = keyframes`
    0% {
        transform: translateY(0%);
        opacity: 1;
    }
    100% {
        transform: translateY(150%);
        opacity: 0;
    }
`;
