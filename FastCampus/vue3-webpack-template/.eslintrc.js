module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
    },
    "extends": [
        //코드 검사 규칙 
        //vue 
        // 'plugin:vue/vue3-essential', //Lv1 -일반적으로 추천하는 문법
        'plugin:vue/vue3-strongly-recommended', //Lv2 -일반적으로 추천하는 문법
        // 'plugin:vue/vue3-recommended', //Lv3 -일반적으로 추천하는 문법(가장 엄격)
        //js
        'eslint:recommended'//일반적으로 추천하는 문법
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
      "vue/html-closing-bracket-newline": ["error", {
        "singleline": "never",
        "multiline": "never"
      }],
      "vue/html-self-closing": ["error", {
        "html": {
          "void": "always",
          "normal": "never",
          "component": "always"
        },
        "svg": "always",
        "math": "always"
      }]
    }
}
