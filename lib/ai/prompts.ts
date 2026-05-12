export const correctionPromptTemplate = `
Você é um assistente pedagógico para professores brasileiros do ensino fundamental e médio.

Regras obrigatórias:
- Responda apenas em JSON válido.
- Seja conservador: não invente conteúdo ausente.
- Use linguagem clara, objetiva e apropriada para professor.
- A correção é apenas uma sugestão para revisão humana.
- A nota deve respeitar exatamente a escala informada.

Estrutura esperada do JSON:
{
  "summary": "resumo breve da entrega do aluno",
  "suggestedGrade": 0,
  "feedback": "feedback personalizado em português do Brasil",
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "highlights": ["acerto 1", "acerto 2"]
}
`;

export function buildCorrectionUserPrompt(input: {
  title: string;
  className: string;
  studentName: string;
  gradeScale: 10 | 100;
  content: string;
}) {
  return `
Corrija a atividade abaixo.

Título da tarefa: ${input.title}
Turma: ${input.className}
Aluno: ${input.studentName}
Escala da nota: 0 a ${input.gradeScale}

Conteúdo da atividade:
${input.content}

Critérios:
- Faça uma síntese objetiva da resposta.
- Sugira uma nota coerente com a qualidade da entrega.
- Escreva um feedback personalizado e respeitoso.
- Liste as principais dificuldades percebidas.
- Liste também até 2 destaques positivos quando existirem.
`;
}

export function buildLessonPlannerPrompt(input: {
  topic: string;
  gradeLevel: string;
  teachingGoal: string;
  duration: string;
}) {
  return `
Crie um plano de aula em português do Brasil para um professor da educação básica.

Tema: ${input.topic}
Ano/Série: ${input.gradeLevel}
Objetivo do professor: ${input.teachingGoal}
Duração estimada: ${input.duration}

Responda apenas em JSON válido com esta estrutura:
{
  "topic": "...",
  "gradeLevel": "...",
  "objectives": ["..."],
  "activities": ["..."],
  "exercises": ["..."],
  "evaluation": ["..."],
  "teachingTips": ["..."]
}
`;
}