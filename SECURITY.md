# Política de Segurança

## Versões suportadas

| Versão | Suporte ativo |
| ------ | ------------- |
| main   | Sim           |

## Reportar uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto, **não abra uma issue pública**.

Entre em contato diretamente por e-mail:

**kallebesiqueira@gmail.com**

Inclua na mensagem:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (opcional)

O prazo esperado para resposta inicial é de **72 horas**. Após confirmação, a correção será priorizada e você será notificado quando a versão corrigida for publicada.

## Escopo

Este projeto lida com dados de professores e alunos do ensino básico brasileiro. As seguintes áreas são consideradas de alto impacto:

- Autenticação e autorização (Supabase Auth + RLS)
- Acesso a arquivos de atividades (Storage bucket privado)
- Injeção em prompts enviados à API de IA
- Exposição de variáveis de ambiente ou chaves de API

## Práticas de segurança adotadas

- Row Level Security (RLS) habilitado em todas as tabelas
- Chave de serviço do Supabase usada apenas em rotas de servidor
- Nenhum dado sensível exposto ao cliente
- Validação de schema com Zod em todas as entradas de API
- Soft-delete para preservar histórico auditável
