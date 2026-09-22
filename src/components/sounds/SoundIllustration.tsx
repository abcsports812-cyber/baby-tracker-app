import Svg, { Circle, Ellipse, G, Mask, Path, Polyline, Rect } from 'react-native-svg';
import { palette } from '../../theme';

export type SoundIllustrationKey =
  | 'whiteNoise'
  | 'rain'
  | 'womb'
  | 'lullaby'
  | 'heartbeat'
  | 'nature'
  | 'shushing'
  | 'ocean'
  | 'fan'
  | 'hairDryer'
  | 'calmSleep'
  | 'ambient';

interface Props {
  variant: SoundIllustrationKey;
  size?: number;
  /** 'pastel' (default) for use on the light Sounds badge background;
   * 'mono' renders a single soft-white silhouette for use on a solid
   * accent-colored circle (the full-screen player's artwork). */
  tone?: 'pastel' | 'mono';
}

const SOUND_BLUE = '#5B8DEF';

/** A small teardrop shape, reused (rotated) for raindrops and fan blades —
 * keeping the family visually related rather than inventing a one-off
 * shape per icon. */
function Teardrop({ cx, cy, scale = 1, rotation = 0, fill }: { cx: number; cy: number; scale?: number; rotation?: number; fill: string }) {
  return (
    <Path
      d="M0 -5.4C1.8 -1.8 3 0.6 3 2.4A3 3 0 1 1 -3 2.4C-3 0.6 -1.8 -1.8 0 -5.4Z"
      fill={fill}
      transform={`translate(${cx} ${cy}) rotate(${rotation}) scale(${scale})`}
    />
  );
}

/** Puffy cloud built from primitives (rounded base + three overlapping
 * circles) so the silhouette is simple, original, and reliably renders. */
function CloudShape({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <G>
      <Circle cx="8" cy="12" r="3.6" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.3 : 0} />
      <Circle cx="12.5" cy="9.6" r="4.6" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.3 : 0} />
      <Circle cx="17" cy="12" r="3.6" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.3 : 0} />
      <Rect x="5" y="11.6" width="14.5" height="6.4" rx="3.2" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.3 : 0} />
    </G>
  );
}

function SleepyEyes({ color, y = 13.4 }: { color: string; y?: number }) {
  return (
    <G stroke={color} strokeWidth={1.4} strokeLinecap="round" fill="none">
      <Path d={`M9 ${y}c0.8 0.9 2 0.9 2.8 0`} />
      <Path d={`M14.2 ${y}c0.8 0.9 2 0.9 2.8 0`} />
    </G>
  );
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return <Path d={`M${pts.join(' L')}Z`} fill={fill} />;
}

export function SoundIllustration({ variant, size = 24, tone = 'pastel' }: Props) {
  const mono = tone === 'mono';
  const blue = mono ? palette.white : SOUND_BLUE;
  const blueSoft = mono ? 'rgba(255,255,255,0.55)' : '#C7DBFA';
  const pink = mono ? palette.white : palette.primaryPink;
  const pinkSoft = mono ? 'rgba(255,255,255,0.55)' : palette.softPink;
  const yellow = mono ? palette.white : palette.softYellowDark;
  const yellowSoft = mono ? 'rgba(255,255,255,0.55)' : palette.softYellow;
  const green = mono ? palette.white : palette.mintDark;
  const greenSoft = mono ? 'rgba(255,255,255,0.55)' : palette.mint;
  const lavender = mono ? palette.white : palette.lavenderDark;
  const lavenderSoft = mono ? 'rgba(255,255,255,0.55)' : palette.lavender;

  switch (variant) {
    case 'whiteNoise':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <CloudShape fill={blueSoft} stroke={blue} />
          <G stroke={blue} strokeWidth={1.4} strokeLinecap="round" fill="none">
            <Path d="M18.5 6.5c1 0.9 1 2.1 0 3" />
            <Path d="M20.5 5c1.9 1.7 1.9 4.3 0 6" />
          </G>
        </Svg>
      );

    case 'rain':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <CloudShape fill={blueSoft} stroke={blue} />
          <Teardrop cx={8.5} cy={19.5} scale={0.62} fill={blue} />
          <Teardrop cx={12.5} cy={20.5} scale={0.62} fill={blue} />
          <Teardrop cx={16.5} cy={19.5} scale={0.62} fill={blue} />
        </Svg>
      );

    case 'womb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M17.5 5.5c2.3 2 3.5 4.7 3.5 7.5 0 4.97-4.03 9-9 9s-9-4.03-9-9c0-2.7 1.1-5.3 3.3-7.3"
            stroke={pink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="12" cy="13.2" r="2.6" fill={pinkSoft} />
          <Circle cx="12" cy="13.2" r="1" fill={pink} />
        </Svg>
      );

    case 'lullaby':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Mask id="lullabyMoonMask">
            <Circle cx="10.5" cy="10.5" r="6" fill="white" />
            <Circle cx="13.5" cy="7.7" r="5.2" fill="black" />
          </Mask>
          <Circle cx="10.5" cy="10.5" r="6" fill={yellow} mask="url(#lullabyMoonMask)" />
          <Star cx={18} cy={6.5} r={1.6} fill={yellowSoft} />
          <G fill={blue}>
            <Circle cx="8.3" cy="18.5" r="1.7" />
            <Circle cx="14.3" cy="19.6" r="1.7" />
            <Rect x="9.4" y="12.4" width="1.2" height="6.6" rx="0.6" />
            <Rect x="15.4" y="11.4" width="1.2" height="8.7" rx="0.6" />
            <Path d="M9.4 12.4 15.4 11.4 15.4 13.1 9.4 14.1Z" />
          </G>
        </Svg>
      );

    case 'heartbeat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 20.2S3.8 15.3 3.8 9.4C3.8 6.4 6.1 4.3 8.7 4.3c1.7 0 3.1 0.9 3.3 2.4 0.2-1.5 1.6-2.4 3.3-2.4 2.6 0 4.9 2.1 4.9 5.1 0 5.9-8.2 10.8-8.2 10.8Z"
            fill={pinkSoft}
            stroke={pink}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <Polyline
            points="7,12.5 9.4,12.5 10.6,9.6 12.1,15.2 13.2,12.5 16.7,12.5"
            fill="none"
            stroke={mono ? SOUND_BLUE : palette.white}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'nature':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Ellipse cx="12" cy="10.5" rx="7.4" ry="4.6" fill={greenSoft} stroke={green} strokeWidth={1.3} transform="rotate(-38 12 10.5)" />
          <Path d="M12 6.5C10.5 10 10.5 15 9.2 19.5" stroke={green} strokeWidth={1.2} strokeLinecap="round" fill="none" />
        </Svg>
      );

    case 'shushing':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <CloudShape fill={blueSoft} stroke={blue} />
          <SleepyEyes color={blue} />
          <Circle cx="15.6" cy="16.4" r="0.9" fill={pink} />
        </Svg>
      );

    case 'ocean':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <G stroke={blue} strokeWidth={1.5} strokeLinecap="round" fill="none">
            <Path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity={0.55} />
            <Path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity={0.8} />
            <Path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          </G>
        </Svg>
      );

    case 'fan':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Teardrop cx={12} cy={12} scale={1.35} rotation={0} fill={blueSoft} />
          <Teardrop cx={12} cy={12} scale={1.35} rotation={120} fill={blue} />
          <Teardrop cx={12} cy={12} scale={1.35} rotation={240} fill={blueSoft} />
          <Circle cx="12" cy="12" r="1.6" fill={mono ? SOUND_BLUE : palette.white} stroke={blue} strokeWidth={1} />
        </Svg>
      );

    case 'hairDryer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <G>
            <Path
              d="M4.5 8.2c0-2.1 1.9-3.7 4.4-3.7 3 0 6.1 1.3 8.3 3.5 1.1 1.1 1.1 2.9 0 4-2.2 2.2-5.3 3.5-8.3 3.5-2.5 0-4.4-1.6-4.4-3.7Z"
              fill={blueSoft}
              stroke={blue}
              strokeWidth={1.3}
              strokeLinejoin="round"
            />
            <Path d="M7.6 15.1 5 20.3" stroke={blue} strokeWidth={1.6} strokeLinecap="round" />
            <Circle cx="8.6" cy="8.2" r="1.7" fill={blue} />
            <G stroke={blue} strokeWidth={1.2} strokeLinecap="round" fill="none">
              <Path d="M19 6.4c0.9 0.8 0.9 1.9 0 2.7" />
              <Path d="M20.6 5c1.7 1.5 1.7 3.8 0 5.3" />
            </G>
          </G>
        </Svg>
      );

    case 'calmSleep':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Mask id="calmSleepMoonMask">
            <Circle cx="11.5" cy="11" r="6.2" fill="white" />
            <Circle cx="14.6" cy="8.1" r="5.4" fill="black" />
          </Mask>
          <Circle cx="11.5" cy="11" r="6.2" fill={yellow} mask="url(#calmSleepMoonMask)" />
          <SleepyEyes color={mono ? SOUND_BLUE : '#B98A1F'} y={11.6} />
          <Star cx={18.5} cy={17} r={1.5} fill={blue} />
          <Star cx={6} cy={19} r={1.1} fill={blueSoft} />
        </Svg>
      );

    case 'ambient':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" fill={lavenderSoft} opacity={0.5} />
          <Circle cx="12" cy="12" r="6.2" fill={lavenderSoft} opacity={0.75} />
          <Circle cx="12" cy="12" r="3.4" fill={lavender} />
          <Circle cx="18" cy="6.5" r="1" fill={yellow} />
          <Circle cx="5.5" cy="17.5" r="0.8" fill={blueSoft} />
        </Svg>
      );

    default:
      return null;
  }
}
