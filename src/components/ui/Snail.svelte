<script lang="ts">
  let { size = '100%' } = $props<{ size?: string }>()
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="120 60 170 95"
  width={size}
  height={size}
>
  <style>
    :root {
      --snail-body-color: #9cd08f;
      --shell-main-color: #e0a96d;
      --shell-outline-color: #8c6239;
      --eye-color: #2c3e50;
      --snail-speed: 0.8s;
    }

    .snail-body {
      animation: stretch var(--snail-speed) ease-in-out infinite;
      transform-origin: 100px 150px;
    }

    .snail-shell {
      animation: bob var(--snail-speed) ease-in-out infinite;
      transform-origin: 95px 110px;
    }

    @keyframes stretch {
      0%,
      100% {
        transform: scaleX(1);
      }
      50% {
        transform: scaleX(1.06);
      }
    }

    @keyframes bob {
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(1px) rotate(-1.5deg);
      }
    }
  </style>

  <g class="snail-container" transform="translate(100, 0)">
    <g class="snail-body">
      <path
        d="M 30 148 C 30 148, 80 148, 140 148 C 170 148, 175 125, 160 110 C 150 100, 135 115, 125 125 C 100 140, 50 140, 30 148 Z"
        fill="var(--snail-body-color)"
      />

      <path
        d="M 152 128 Q 157 133, 162 128"
        fill="none"
        stroke="var(--eye-color)"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.8"
      />

      <line
        x1="140"
        y1="120"
        x2="145"
        y2="85"
        stroke="var(--snail-body-color)"
        stroke-width="4"
        stroke-linecap="round"
      />
      <circle cx="145" cy="85" r="4" fill="var(--eye-color)" />
      <circle cx="143" cy="83" r="1.5" fill="white" opacity="0.9" />

      <line
        x1="155"
        y1="113"
        x2="175"
        y2="90"
        stroke="var(--snail-body-color)"
        stroke-width="4"
        stroke-linecap="round"
      />
      <circle cx="175" cy="90" r="4" fill="var(--eye-color)" />
      <circle cx="173" cy="88" r="1.5" fill="white" opacity="0.9" />
    </g>

    <g class="snail-shell">
      <circle
        cx="95"
        cy="110"
        r="38"
        fill="var(--shell-main-color)"
        stroke="var(--shell-outline-color)"
        stroke-width="4"
      />
      <path
        d="M 95 110 M 95 85 A 25 25 0 0 1 120 110 A 25 25 0 0 1 95 135 A 18 18 0 0 1 77 117 A 12 12 0 0 1 89 105 A 5 5 0 0 1 95 110"
        fill="none"
        stroke="var(--shell-outline-color)"
        stroke-width="4"
        stroke-linecap="round"
      />
    </g>
  </g>
</svg>
