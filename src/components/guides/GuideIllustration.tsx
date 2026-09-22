import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '../../theme';

export type GuideIllustrationKey =
  // category icons
  | 'development'
  | 'play'
  | 'sleep'
  | 'feeding'
  | 'parenting'
  // activity-type icons
  | 'movement'
  | 'sensory'
  | 'music'
  | 'reading'
  | 'social'
  | 'exploration';

interface Props {
  variant: GuideIllustrationKey;
  size?: number;
  /** 'mono' renders a single soft-white silhouette, for use on a solid
   * accent-colored circle (matches the Sounds player-artwork treatment). */
  tone?: 'pastel' | 'mono';
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return <Path d={`M${pts.join(' L')}Z`} fill={fill} />;
}

export function GuideIllustration({ variant, size = 24, tone = 'pastel' }: Props) {
  const mono = tone === 'mono';
  const white = palette.white;
  const wSoft = 'rgba(255,255,255,0.55)';

  const blue = mono ? white : palette.babyBlueDark;
  const blueSoft = mono ? wSoft : palette.babyBlue;
  const peach = mono ? white : palette.peachDark;
  const peachSoft = mono ? wSoft : palette.peach;
  const lavender = mono ? white : palette.lavenderDark;
  const lavenderSoft = mono ? wSoft : palette.lavender;
  const orange = mono ? white : '#F2A65A';
  const orangeSoft = mono ? wSoft : '#FFE3C2';
  const pink = mono ? white : palette.primaryPink;
  const pinkSoft = mono ? wSoft : palette.softPink;
  const mint = mono ? white : palette.mintDark;
  const mintSoft = mono ? wSoft : palette.mint;
  const yellow = mono ? white : palette.softYellowDark;

  switch (variant) {
    case 'development':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="4" y="15" width="16" height="5" rx="1.6" fill={blueSoft} stroke={blue} strokeWidth={1.1} />
          <Rect x="6.5" y="10" width="11" height="5" rx="1.6" fill={peachSoft} stroke={peach} strokeWidth={1.1} />
          <Rect x="9" y="5" width="6" height="5" rx="1.6" fill={blueSoft} stroke={blue} strokeWidth={1.1} />
          <Star cx={18.5} cy={4.5} r={1.7} fill={yellow} />
        </Svg>
      );

    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="11.2" y="3.5" width="1.6" height="17" rx="0.8" fill={peach} />
          <Ellipse cx="12" cy="8.5" rx="6" ry="2.3" fill={peachSoft} stroke={peach} strokeWidth={1.1} />
          <Ellipse cx="12" cy="13.5" rx="5" ry="2.1" fill={mintSoft} stroke={mint} strokeWidth={1.1} />
          <Ellipse cx="12" cy="18" rx="4" ry="1.9" fill={blueSoft} stroke={blue} strokeWidth={1.1} />
        </Svg>
      );

    case 'sleep':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M5 9.5 L6.5 16.5A6 6 0 0 0 17.5 16.5L19 9.5Z"
            fill={lavenderSoft}
            stroke={lavender}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <Path d="M4 18c2.5 1.6 5.4 1.6 8 0.9 2.6 0.7 5.5 0.7 8-0.9" stroke={lavender} strokeWidth={1.3} strokeLinecap="round" fill="none" />
          <Star cx={18} cy={5} r={1.6} fill={yellow} />
        </Svg>
      );

    case 'feeding':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Ellipse cx="12" cy="5.3" rx="1.9" ry="1.6" fill={orange} />
          <Rect x="10" y="6.3" width="4" height="3.4" rx="1" fill={orangeSoft} stroke={orange} strokeWidth={1} />
          <Rect x="8.3" y="9.4" width="7.4" height="11.4" rx="2.4" fill={orangeSoft} stroke={orange} strokeWidth={1.3} />
          <Rect x="9.6" y="14.2" width="4.8" height="1" rx="0.5" fill={orange} />
          <Rect x="9.6" y="17" width="4.8" height="1" rx="0.5" fill={orange} />
        </Svg>
      );

    case 'parenting':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 20.2S3.8 15.3 3.8 9.4C3.8 6.4 6.1 4.3 8.7 4.3c1.7 0 3.1 0.9 3.3 2.4 0.2-1.5 1.6-2.4 3.3-2.4 2.6 0 4.9 2.1 4.9 5.1 0 5.9-8.2 10.8-8.2 10.8Z"
            fill={pinkSoft}
            stroke={pink}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <Circle cx="10.3" cy="12.4" r="1.5" fill={mono ? palette.primaryPink : white} />
          <Circle cx="13.7" cy="12.4" r="1.5" fill={mono ? palette.primaryPink : white} />
        </Svg>
      );

    case 'movement':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="14" cy="12" r="4.2" fill={blueSoft} stroke={blue} strokeWidth={1.2} />
          <G stroke={blue} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.8}>
            <Path d="M6.5 16.5c1-1 1.7-2.3 2-3.8" />
            <Path d="M4 13.5c1.4-1.2 2.4-2.9 2.8-4.8" />
          </G>
        </Svg>
      );

    case 'sensory':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12.5" r="6" fill={mintSoft} stroke={mint} strokeWidth={1.2} />
          <G fill={mint}>
            <Circle cx="9.5" cy="10.5" r="0.9" />
            <Circle cx="14.5" cy="10.2" r="0.9" />
            <Circle cx="12" cy="14" r="0.9" />
            <Circle cx="9.3" cy="14.8" r="0.7" />
            <Circle cx="15" cy="14.6" r="0.7" />
          </G>
        </Svg>
      );

    case 'music':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="9" cy="17.5" r="2.1" fill={peach} />
          <Rect x="10.8" y="5.5" width="1.2" height="12.3" rx="0.6" fill={peach} />
          <Path d="M10.8 5.5 17 4 17 8.4 10.8 9.9Z" fill={peach} />
          <Star cx={19} cy={13.5} r={1.3} fill={yellow} />
        </Svg>
      );

    case 'reading':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 6.3 4.5 7.9 4.5 18 12 16.4Z" fill={peachSoft} stroke={peach} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d="M12 6.3 19.5 7.9 19.5 18 12 16.4Z" fill={blueSoft} stroke={blue} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d="M6.6 10.2 10 9.5M6.6 12.8 10 12.1M14 9.5 17.4 10.2M14 12.1 17.4 12.8" stroke={mono ? white : palette.textFaint} strokeWidth={0.8} strokeLinecap="round" />
        </Svg>
      );

    case 'social':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="7.2" fill={orangeSoft} stroke={orange} strokeWidth={1.2} />
          <Circle cx="9.3" cy="10.5" r="1.05" fill={orange} />
          <Circle cx="14.7" cy="10.5" r="1.05" fill={orange} />
          <Path d="M8.8 14.3c1 1.2 5.4 1.2 6.4 0" stroke={orange} strokeWidth={1.3} strokeLinecap="round" fill="none" />
        </Svg>
      );

    case 'exploration':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4.5 10.5 12 8 19.5 10.5 19.5 18.5 4.5 18.5Z" fill={blueSoft} stroke={blue} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M4.5 10.5 12 13 19.5 10.5" fill="none" stroke={blue} strokeWidth={1.1} strokeLinejoin="round" />
          <Path d="M12 8 12 13" stroke={blue} strokeWidth={1.1} />
          <Star cx={18.5} cy={5} r={1.7} fill={yellow} />
        </Svg>
      );

    default:
      return null;
  }
}
