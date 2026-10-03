import React from 'react';

interface SirwiseLogoProps {
  className?: string;
  showText?: boolean;
}

export const SirwiseLogo: React.FC<SirwiseLogoProps> = ({ className = 'h-14 w-auto', showText = true }) => {
  return (
    <svg 
      viewBox={showText ? "0 0 420 120" : "0 0 130 120"} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Deep Globe Gradient */}
        <radialGradient id="sirwiseGlobeBlue" cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="35%" stopColor="#0284C7" />
          <stop offset="75%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0B132B" />
        </radialGradient>

        {/* Silver Metallic Gradient */}
        <linearGradient id="sirwiseSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="sirwiseSilverDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Gold Metallic Gradient */}
        <linearGradient id="sirwiseGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        <linearGradient id="sirwiseGoldBright" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Shadow Drop */}
        <filter id="sirwiseShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* GLOBE, CAP & ORBIT GROUP */}
      <g filter="url(#sirwiseShadow)">
        {/* Silver Structural Base Support (Crescent Crescent shape under globe) */}
        <path 
          d="M 32 68 C 32 88 48 104 68 104 C 88 104 104 88 104 68 C 104 65 103 61 102 58 C 98 77 84 90 68 90 C 52 90 38 77 34 58 C 33 61 32 65 32 68 Z" 
          fill="url(#sirwiseSilver)" 
          stroke="#475569" 
          strokeWidth="0.5" 
        />
        
        {/* Highlight curve on bottom support */}
        <path 
          d="M 38 74 C 45 92 59 100 68 100 C 77 100 91 92 98 74 C 91 88 79 94 68 94 C 57 94 45 88 38 74 Z" 
          fill="#94A3B8" 
          opacity="0.5" 
        />

        {/* The Core Globe sphere */}
        <circle cx="68" cy="68" r="25" fill="url(#sirwiseGlobeBlue)" />

        {/* Simplified metallic silver global continents map */}
        <path d="M 51 59 C 49 57 52 52 55 52 C 57 52 58 56 60 57 C 62 58 63 55 65 55 C 67 55 67 58 66 60 C 64 61 62 61 61 63 C 59 64 58 67 56 67 C 54 67 53 61 51 59 Z" fill="#E2E8F0" opacity="0.8" />
        <path d="M 73 52 C 71 52 69 55 69 57 C 69 59 72 59 73 61 C 74 63 72 66 74 68 C 76 70 81 67 83 65 C 85 63 86 60 84 58 C 82 56 80 56 78 54 C 76 52 75 52 73 52 Z" fill="#E2E8F0" opacity="0.8" />
        <path d="M 49 75 C 47 73 46 77 47 79 C 48 81 52 81 53 79 C 54 77 51 75 49 75 Z" fill="#E2E8F0" opacity="0.8" />
        <path d="M 66 78 C 63 78 62 81 62 83 C 62 85 66 87 68 87 C 70 87 69 82 71 80 C 73 78 70 78 66 78 Z" fill="#E2E8F0" opacity="0.8" />
        <path d="M 80 73 C 78 71 76 75 76 77 C 76 79 79 80 81 80 C 83 80 84 75 80 73 Z" fill="#E2E8F0" opacity="0.8" />

        {/* Orbital swooshing golden ring across the front */}
        <path 
          d="M 28 77 C 32 85 48 87 68 87 C 88 87 108 80 118 65 C 120 62 119 60 114 62 C 101 73 83 80 68 80 C 49 80 34 73 30 66 C 28 65 26 69 28 77 Z" 
          fill="url(#sirwiseGold)" 
          stroke="#B45309" 
          strokeWidth="0.5" 
        />
        
        {/* Orbital inner gold neon highlight line */}
        <path 
          d="M 33 75 C 43 81 61 83 71 83 C 81 83 99 76 109 67 C 99 73 81 78 71 78 C 57 78 41 73 33 68" 
          fill="none" 
          stroke="#FDE047" 
          strokeWidth="1.75" 
          opacity="0.8" 
        />

        {/* Cap neck connector */}
        <path 
          d="M 49 46 L 87 46 C 87 46 83 52 68 52 C 53 52 49 46 49 46 Z" 
          fill="url(#sirwiseSilverDark)" 
          stroke="#334155" 
          strokeWidth="0.5" 
        />
        <ellipse cx="68" cy="46" rx="19" ry="2.5" fill="#1E293B" />

        {/* Graduation cap top diamond board */}
        <polygon 
          points="68,28 112,39 68,50 24,39" 
          fill="url(#sirwiseSilver)" 
          stroke="#334155" 
          strokeWidth="0.75" 
        />
        
        {/* Bright metallic silver highlight polygon */}
        <polygon 
          points="68,30 108,39 68,47 28,39" 
          fill="#FFFFFF" 
          opacity="0.3" 
        />

        {/* Gold Tassel */}
        {/* Tassel line cord */}
        <path 
          d="M 68 39 C 81 39 96 46 97 53" 
          fill="none" 
          stroke="url(#sirwiseGold)" 
          strokeWidth="1.25" 
        />
        {/* Tassel metallic cap */}
        <ellipse cx="97" cy="55" rx="1.75" ry="2.5" fill="url(#sirwiseGoldBright)" />
        {/* Tassel fringes hanging */}
        <path d="M 95 57 L 99 57 L 100 66 L 94 66 Z" fill="url(#sirwiseGold)" />
      </g>

      {/* BRAND TEXT GROUP */}
      {showText && (
        <g>
          {/* "SIR" in beautiful silver gradient */}
          <text 
            x="135" 
            y="74" 
            fontFamily="'Cinzel', 'Times New Roman', 'Georgia', serif" 
            fontSize="40" 
            fontWeight="900" 
            letterSpacing="1" 
            fill="url(#sirwiseSilver)" 
            stroke="#475569" 
            strokeWidth="0.5"
          >
            SIR
          </text>
          
          {/* "WISE" in rich gold gradient */}
          <text 
            x="218" 
            y="74" 
            fontFamily="'Cinzel', 'Times New Roman', 'Georgia', serif" 
            fontSize="40" 
            fontWeight="900" 
            letterSpacing="1" 
            fill="url(#sirwiseGold)" 
            stroke="#B45309" 
            strokeWidth="0.5"
          >
            WISE
          </text>

          {/* Under-text elegant metallic vector swooshes */}
          {/* Gold highlight swoosh below "SIR" */}
          <path 
            d="M 120 84 C 170 94 225 94 250 90 C 190 92 145 89 120 84 Z" 
            fill="url(#sirwiseGold)" 
          />
          
          {/* Silver support swoosh extending further right under "WISE" */}
          <path 
            d="M 190 92 C 245 92 310 86 345 78 C 290 85 230 91 190 92 Z" 
            fill="url(#sirwiseSilver)" 
          />
        </g>
      )}
    </svg>
  );
};
