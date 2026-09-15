// commitlint.config.cjs
// CJS extension necessária porque o projeto usa "type": "module"
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',    // nova funcionalidade
        'fix',     // correção de bug
        'docs',    // documentação
        'style',   // formatação (sem mudança de lógica)
        'refactor',// refatoração
        'test',    // testes
        'chore',   // tarefas de manutenção
        'perf',    // melhoria de performance
        'ci',      // mudanças de CI/CD
        'revert',  // reverter commit
      ],
    ],
    'subject-case': [0], // desabilita regra de case (aceita PT-BR)
  },
};
