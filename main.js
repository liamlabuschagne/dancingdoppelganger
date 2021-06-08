'strict mode';

import Draw from "./js/draw.js";

const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");

const draw = new Draw(ctx, canvas, video);
