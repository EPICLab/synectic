/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */

/**
 * Icons from: https://materialdesignicons.com/
 */

import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';

export const GitRepo = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-repo" {...props}>
      <path
        fillOpacity="0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 15L17.5 12L14.5 9M9.5 9L6.5 12L9.5 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
      />
    </SvgIcon>
  );
};

export const GitBranch = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-branch" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-48.000000, 0.000000)" fillRule="nonzero">
          <g transform="translate(48.000000, 0.000000)">
            <path
              d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
              fillRule="nonzero"
            />
            <path
              d="M18,3 C19.6569,3 21,4.34315 21,6 C21,7.30622 20.1652,8.41746 19,8.82929 L19,9 C19,11.2091 17.2091,13 15,13 L9,13 C7.89543,13 7,13.8954 7,15 L7,15.1707 C8.16519,15.5825 9,16.6938 9,18 C9,19.6569 7.65685,21 6,21 C4.34315,21 3,19.6569 3,18 C3,16.6938 3.83481,15.5825 5,15.1707 L5,8.82929 C3.83481,8.41746 3,7.30622 3,6 C3,4.34315 4.34315,3 6,3 C7.65685,3 9,4.34315 9,6 C9,7.30622 8.16519,8.41746 7,8.82929 L7,11.5351 C7.58835,11.1948 8.27143,11 9,11 L15,11 C16.1046,11 17,10.1046 17,9 L17,8.82929 C15.8348,8.41746 15,7.30622 15,6 C15,4.34315 16.3431,3 18,3 Z M6,17 C5.44772,17 5,17.4477 5,18 C5,18.5523 5.44772,19 6,19 C6.55228,19 7,18.5523 7,18 C7,17.4477 6.55228,17 6,17 Z M6,5 C5.44772,5 5,5.44772 5,6 C5,6.55228 5.44772,7 6,7 C6.55228,7 7,6.55228 7,6 C7,5.44772 6.55228,5 6,5 Z M18,5 C17.4477,5 17,5.44772 17,6 C17,6.55228 17.4477,7 18,7 C18.5523,7 19,6.55228 19,6 C19,5.44772 18.5523,5 18,5 Z"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitDeleteBranch = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-delete-branch" {...props}>
      <g
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="translate(-24.000000, 0.000000)">
          <g transform="translate(24.000000, 0.000000)">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M7 8v8" />
            <path d="M9 18h6a2 2 0 0 0 2 -2v-5" />
            <path d="M14 14l3 -3l3 3" />
            <path d="M15 4l4 4" />
            <path d="M15 8l4 -4" />
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitCommit = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-commit" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-528.000000, 0.000000)">
          <g transform="translate(528.000000, 0.000000)">
            <path
              fillRule="nonzero"
              d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
            />
            <path
              fill="currentColor"
              d="M12,2 C12.5523,2 13,2.44772 13,3 L13,8.12602 C14.7252,8.57006 16,10.1362 16,12 C16,13.8638 14.7252,15.4299 13,15.874 L13,21 C13,21.5523 12.5523,22 12,22 C11.4477,22 11,21.5523 11,21 L11,15.874 C9.27477,15.4299 8,13.8638 8,12 C8,10.1362 9.27477,8.57006 11,8.12602 L11,3 C11,2.44772 11.4477,2 12,2 Z M12,14 C13.1046,14 14,13.1046 14,12 C14,10.8954 13.1046,10 12,10 C10.8954,10 10,10.8954 10,12 C10,13.1046 10.8954,14 12,14 Z"
            />
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitRevert = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-revert" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" clipRule="evenodd">
        <g transform="translate(-24.000000, 0.000000)">
          <g transform="translate(24.000000, 0.000000)">
            <path
              fill="currentColor"
              d="M15.7071 5.29289C16.0976 5.68341 16.0976 6.31658 15.7071 6.7071C15.3166 7.09763 14.6834 7.09763 14.2929 6.70711L13 5.4142L13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12L11 5.41423L9.70711 6.7071C9.31659 7.09763 8.68342 7.09763 8.2929 6.70711C7.90237 6.31659 7.90237 5.68342 8.29289 5.29289L11.2929 2.2929C11.6834 1.90237 12.3166 1.90237 12.7071 2.29289L15.7071 5.29289Z"
            />
            <path
              fill="currentColor"
              d="M12 14C9.79086 14 8 15.7909 8 18C8 20.2091 9.79086 22 12 22C14.2091 22 16 20.2091 16 18C16 15.7909 14.2091 14 12 14ZM10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18Z"
            />
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitCompare = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-compare" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-576.000000, 0.000000)">
          <g transform="translate(576.000000, 0.000000)">
            <path
              fillRule="nonzero"
              d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
            ></path>
            <path
              fill="currentColor"
              d="M6,2.99994 C7.65685,2.99994 9,4.34309 9,5.99994 C9,7.240849 8.24658397,8.30578855 7.1722376,8.76227298 L7,8.82923 L7,15.9999 C7,16.51275 7.38604429,16.9354092 7.88337975,16.9931725 L8,16.9999 L10.2071,16.9999 L9.79291,16.5857 C9.40239,16.1952 9.40239,15.562 9.79291,15.1715 C10.1533623,14.8110385 10.7206208,14.7833107 11.1128973,15.0883166 L11.2071,15.1715 L13.3284,17.2928 C13.6889538,17.6533538 13.7166888,18.2205349 13.4116047,18.6127989 L13.3284,18.707 L11.2071,20.8284 C10.8166,21.2189 10.1834,21.2189 9.79291,20.8284 C9.43243,20.4678462 9.40470077,19.9006651 9.70972231,19.5084011 L9.79291,19.4142 L10.2071,18.9999 L8,18.9999 C6.40232321,18.9999 5.09633941,17.7510226 5.00509271,16.1761773 L5,15.9999 L5,8.82923 C3.83481,8.4174 3,7.30616 3,5.99994 C3,4.34309 4.34315,2.99994 6,2.99994 Z M12.7928,3.17156 C13.1834,2.78103 13.8165,2.78103 14.207,3.17156 C14.5675538,3.53204 14.5952888,4.09926651 14.2902047,4.49156153 L14.207,4.58577 L13.7929,4.99994 L16,4.99994 C17.597725,4.99994 18.903664,6.24885462 18.9949075,7.82366664 L19,7.99994 L19,15.1706 C20.1652,15.5825 21,16.6937 21,17.9999 C21,19.6568 19.6569,20.9999 18,20.9999 C16.3431,20.9999 15,19.6568 15,17.9999 C15,16.75901 15.753407,15.6941075 16.827761,15.2375667 L17,15.1706 L17,7.99994 C17,7.48710857 16.613973,7.06443347 16.1166239,7.0066678 L16,6.99994 L13.7929,6.99994 L14.2071,7.41415 C14.5976,7.80468 14.5976,8.43784 14.2071,8.82837 C13.8466385,9.18885 13.2793793,9.21657923 12.8871027,8.91155769 L12.7929,8.82837 L10.6716,6.70705 C10.3110462,6.34656077 10.2833112,5.77933355 10.5883953,5.38703848 L10.6716,5.29283 L12.7928,3.17156 Z M18,16.9999 C17.4477,16.9999 17,17.4477 17,17.9999 C17,18.5522 17.4477,18.9999 18,18.9999 C18.5523,18.9999 19,18.5522 19,17.9999 C19,17.4477 18.5523,16.9999 18,16.9999 Z M6,4.99994 C5.44772,4.99994 5,5.44766 5,5.99994 C5,6.55222 5.44772,6.99994 6,6.99994 C6.55228,6.99994 7,6.55222 7,5.99994 C7,5.44766 6.55228,4.99994 6,4.99994 Z"
            ></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitMerge = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-merge" {...props}>
      <g stroke="none" strokeWidth="1" fill="none">
        <g transform="translate(-24.000000, 0.000000)">
          <g transform="translate(24.000000, 0.000000)">
            <path
              fill="currentColor"
              d="M5.559,8.855c0.166,1.183,0.789,3.207,3.087,4.079C11,13.829,11,14.534,11,15v0.163C9.56,15.597,8.5,16.92,8.5,18.5 c0,1.93,1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5c0-1.58-1.06-2.903-2.5-3.337V15c0-0.466,0-1.171,2.354-2.065 c2.298-0.872,2.921-2.896,3.087-4.079C19.912,8.441,21,7.102,21,5.5C21,3.57,19.43,2,17.5,2S14,3.57,14,5.5 c0,1.552,1.022,2.855,2.424,3.313c-0.146,0.735-0.565,1.791-1.778,2.252c-1.192,0.452-2.053,0.953-2.646,1.536 c-0.593-0.583-1.453-1.084-2.646-1.536c-1.213-0.461-1.633-1.517-1.778-2.252C8.978,8.355,10,7.052,10,5.5C10,3.57,8.43,2,6.5,2 S3,3.57,3,5.5C3,7.102,4.088,8.441,5.559,8.855z M17.5,4C18.327,4,19,4.673,19,5.5S18.327,7,17.5,7S16,6.327,16,5.5 S16.673,4,17.5,4z M13.5,18.5c0,0.827-0.673,1.5-1.5,1.5s-1.5-0.673-1.5-1.5S11.173,17,12,17S13.5,17.673,13.5,18.5z M6.5,4 C7.327,4,8,4.673,8,5.5S7.327,7,6.5,7S5,6.327,5,5.5S5.673,4,6.5,4z"
            ></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitAbort = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-abort-merge" {...props}>
      <g
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="translate(-24.000000, 0.000000)">
          <g transform="translate(24.000000, 0.000000)">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="18" r="2" />
            <path d="M6 8v8" />
            <path d="M18 11h.01" />
            <path d="M18 6h.01" />
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitPullRequestOpen = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-pr-open" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-720.000000, 0.000000)">
          <g transform="translate(720.000000, 0.000000)">
            <path
              fillRule="nonzero"
              d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
            ></path>
            <path
              fill="currentColor"
              d="M12.7928,3.17156 C13.1834,2.78103 13.8165,2.78103 14.207,3.17156 C14.5675538,3.53204 14.5952888,4.09926651 14.2902047,4.49156153 L14.207,4.58577 L13.7929,4.99994 L16,4.99994 C17.597725,4.99994 18.903664,6.24885462 18.9949075,7.82366664 L19,7.99994 L19,15.1706 C20.1652,15.5825 21,16.6937 21,17.9999 C21,19.6568 19.6569,20.9999 18,20.9999 C16.3431,20.9999 15,19.6568 15,17.9999 C15,16.75901 15.753407,15.6941075 16.8277611,15.2375667 L17,15.1706 L17,7.99994 C17,7.48710857 16.613973,7.06443347 16.1166239,7.0066678 L16,6.99994 L13.7929,6.99994 L14.2071,7.41415 C14.5976,7.80468 14.5976,8.43784 14.2071,8.82837 C13.8466385,9.18885 13.2793793,9.21657923 12.8871027,8.91155769 L12.7929,8.82837 L10.6716,6.70705 C10.3110462,6.34656077 10.2833112,5.77933355 10.5883953,5.38703848 L10.6716,5.29283 L12.7928,3.17156 Z M6,2.99994 C7.65685,2.99994 9,4.34308 9,5.99994 C9,7.240849 8.24658398,8.30578855 7.1722376,8.76227298 L7,8.82923 L7,15.1706 C8.16519,15.5825 9,16.6937 9,17.9999 C9,19.6568 7.65685,20.9999 6,20.9999 C4.34315,20.9999 3,19.6568 3,17.9999 C3,16.75901 3.75341603,15.6941075 4.8277624,15.2375667 L5,15.1706 L5,8.82923 C3.83481,8.4174 3,7.30616 3,5.99994 C3,4.34308 4.34315,2.99994 6,2.99994 Z M18,16.9999 C17.4477,16.9999 17,17.4477 17,17.9999 C17,18.5522 17.4477,18.9999 18,18.9999 C18.5523,18.9999 19,18.5522 19,17.9999 C19,17.4477 18.5523,16.9999 18,16.9999 Z M6,16.9999 C5.44772,16.9999 5,17.4477 5,17.9999 C5,18.5522 5.44772,18.9999 6,18.9999 C6.55228,18.9999 7,18.5522 7,17.9999 C7,17.4477 6.55228,16.9999 6,16.9999 Z M6,4.99994 C5.44772,4.99994 5,5.44766 5,5.99994 C5,6.55222 5.44772,6.99994 6,6.99994 C6.55228,6.99994 7,6.55222 7,5.99994 C7,5.44766 6.55228,4.99994 6,4.99994 Z"
            ></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};

export const GitPullRequestClose = (props: SvgIconProps) => {
  return (
    <SvgIcon titleAccess="git-pr-close" {...props}>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-672.000000, 0.000000)">
          <g transform="translate(672.000000, 0.000000)">
            <path
              fillRule="nonzero"
              d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
            ></path>
            <path
              fill="currentColor"
              d="M18.0001,9.99998 C18.51295,9.99998 18.9356092,10.3860243 18.9933725,10.8833758 L19.0001,11 L19.0001,15.1707 C20.1653,15.5825 21.0001,16.6938 21.0001,18 C21.0001,19.6568 19.657,21 18.0001,21 C16.3433,21 15.0001,19.6568 15.0001,18 C15.0001,16.75911 15.7535972,15.6941173 16.8278746,15.2376532 L17.0001,15.1707 L17.0001,11 C17.0001,10.4477 17.4479,9.99998 18.0001,9.99998 Z M6,2.99998 C7.65685,2.99998 9,4.34313 9,5.99998 C9,7.240889 8.24658398,8.30582855 7.1722376,8.76232155 L7,8.82928 L7,15.1707 C8.16519,15.5825 9,16.6938 9,18 C9,19.6568 7.65685,21 6,21 C4.34315,21 3,19.6568 3,18 C3,16.75911 3.75341603,15.6941173 4.8277624,15.2376532 L5,15.1707 L5,8.82928 C3.83481,8.41744 3,7.3062 3,5.99998 C3,4.34313 4.34315,2.99998 6,2.99998 Z M18.0001,17 C17.4479,17 17.0001,17.4477 17.0001,18 C17.0001,18.5523 17.4479,19 18.0001,19 C18.5524,19 19.0001,18.5523 19.0001,18 C19.0001,17.4477 18.5524,17 18.0001,17 Z M6,17 C5.44772,17 5,17.4477 5,18 C5,18.5523 5.44772,19 6,19 C6.55228,19 7,18.5523 7,18 C7,17.4477 6.55228,17 6,17 Z M15.1716,3.17156 C15.5320615,2.81107077 16.0993207,2.78334083 16.4915973,3.08837018 L16.5858,3.17156 L18,4.58577 L19.4142,3.17156 C19.8048,2.78103 20.4379,2.78103 20.8284,3.17156 C21.1889538,3.53204 21.2166888,4.09927503 20.9116047,4.4915635 L20.8284,4.58577 L19.4142,5.99998 L20.8284,7.4142 C21.219,7.80472 21.219,8.43789 20.8284,8.82841 C20.4679385,9.18889 19.9007645,9.21661923 19.5084224,8.91159769 L19.4142,8.82841 L18,7.4142 L16.5858,8.82841 C16.1953,9.21893 15.5621,9.21893 15.1716,8.82841 C14.8111385,8.46793 14.7834107,7.90069497 15.0884166,7.5084065 L15.1716,7.4142 L16.5858,5.99998 L15.1716,4.58577 C14.7811,4.19525 14.7811,3.56208 15.1716,3.17156 Z M6,4.99998 C5.44772,4.99998 5,5.4477 5,5.99998 C5,6.55227 5.44772,6.99998 6,6.99998 C6.55228,6.99998 7,6.55227 7,5.99998 C7,5.4477 6.55228,4.99998 6,4.99998 Z"
            ></path>
          </g>
        </g>
      </g>
    </SvgIcon>
  );
};
