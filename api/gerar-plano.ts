import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { IncomingMessage, ServerResponse } from "http";

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanalConteudo {
  plano_semanal: DiaPlano[];
}

const DIAS_PADRAO = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const MEAL_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: "Plano alimentar completo com os dias da semana",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: "Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)",
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Exatamente 5 opções variadas e saudáveis de café da manhã",
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Exatamente 5 opções de lanche da manhã",
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Exatamente 5 opções completas de almoço",
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Exatamente 5 opções de lanche da tarde",
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Exatamente 5 opções nutritivas de jantar",
              },
            },
            required: [
              "cafe_da_manha",
              "lanche_manha",
              "almoco",
              "lanche_tarde",
              "jantar",
            ],
          },
        },
        required: ["dia", "refeicoes"],
      },
    },
  },
  required: ["plano_semanal"],
};

export function formatarDadosPaciente(paciente: any): string {
  if (typeof paciente === "string") return paciente;
  if (!paciente || typeof paciente !== "object") {
    return "Paciente adulto sem restrições graves declaradas. Foco em equilíbrio nutricional e alimentos naturais.";
  }

  const linhas: string[] = [];

  if (paciente.nome) linhas.push(`Nome: ${paciente.nome}`);
  if (paciente.sexo) linhas.push(`Sexo: ${paciente.sexo}`);
  if (paciente.data_nascimento) linhas.push(`Data de Nascimento: ${paciente.data_nascimento}`);
  if (paciente.peso_inicial) linhas.push(`Peso Inicial/Atual: ${paciente.peso_inicial} kg`);
  if (paciente.altura) linhas.push(`Altura: ${paciente.altura} cm`);

  const objetivos = Array.isArray(paciente.objetivos)
    ? paciente.objetivos.join(", ")
    : paciente.objetivos;
  if (objetivos) linhas.push(`Objetivos Principais: ${objetivos}`);
  if (paciente.objetivo_texto) linhas.push(`Detalhes do Objetivo: ${paciente.objetivo_texto}`);

  if (paciente.nivel_atividade) linhas.push(`Nível de Atividade Física: ${paciente.nivel_atividade}`);
  if (paciente.atividade_fisica_descricao) {
    linhas.push(`Rotina de Exercícios: ${paciente.atividade_fisica_descricao}`);
  }

  const patologias = Array.isArray(paciente.patologias)
    ? paciente.patologias.join(", ")
    : paciente.patologias;
  if (patologias) linhas.push(`Patologias / Condições Clínicas: ${patologias}`);

  const restricoes = Array.isArray(paciente.restricoes_alimentares)
    ? paciente.restricoes_alimentares.join(", ")
    : paciente.restricoes_alimentares;
  if (restricoes) linhas.push(`Restrições Alimentares: ${restricoes}`);

  const alergias = Array.isArray(paciente.alergias)
    ? paciente.alergias.join(", ")
    : paciente.alergias;
  if (alergias) linhas.push(`Alergias Alimentares: ${alergias}`);

  if (paciente.medicamentos) linhas.push(`Medicamentos em uso: ${paciente.medicamentos}`);
  if (paciente.suplementos) linhas.push(`Suplementação atual: ${paciente.suplementos}`);
  if (paciente.refeicoes_por_dia) linhas.push(`Número de refeições desejadas/habituais: ${paciente.refeicoes_por_dia}`);
  if (paciente.horario_acorda) linhas.push(`Horário de acordar: ${paciente.horario_acorda}`);
  if (paciente.horario_dorme) linhas.push(`Horário de dormir: ${paciente.horario_dorme}`);
  if (paciente.litros_agua) linhas.push(`Consumo de água diário: ${paciente.litros_agua} Litros`);
  if (paciente.observacoes) linhas.push(`Observações Clínicas e Preferências: ${paciente.observacoes}`);

  return linhas.length > 0
    ? linhas.join("\n")
    : "Paciente em acompanhamento nutricional de rotina.";
}

export function construirPromptInterno(dadosFormatados: string): string {
  return `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;
}

// Normaliza o retorno para garantir sempre 7 dias e 5 opções por refeição
function normalizarPlanoSemanal(json: any): PlanoSemanalConteudo {
  if (!json || typeof json !== "object") {
    throw new Error("Resposta da IA em formato inválido");
  }

  const rawList = Array.isArray(json.plano_semanal) ? json.plano_semanal : [];
  const diasMap = new Map<string, any>();

  for (const item of rawList) {
    if (item && item.dia) {
      diasMap.set(String(item.dia).trim().toLowerCase(), item);
    }
  }

  const normalizado: DiaPlano[] = DIAS_PADRAO.map((diaNome) => {
    const achado =
      diasMap.get(diaNome.toLowerCase()) ||
      rawList.find((it: any) =>
        String(it?.dia || "").toLowerCase().includes(diaNome.slice(0, 3).toLowerCase())
      );

    const normalizarRefeicao = (lista: any, sugestao: string) => {
      const arr = Array.isArray(lista)
        ? lista.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      while (arr.length < 5) {
        arr.push(`Opção ${arr.length + 1} (${sugestao})`);
      }
      return arr.slice(0, 5);
    };

    const refeicoesRaw = achado?.refeicoes || {};

    return {
      dia: diaNome,
      refeicoes: {
        cafe_da_manha: normalizarRefeicao(
          refeicoesRaw.cafe_da_manha,
          "Café com leite desnatado e pão integral com queijo branco"
        ),
        lanche_manha: normalizarRefeicao(
          refeicoesRaw.lanche_manha,
          "Fruta da estação com chia ou aveia"
        ),
        almoco: normalizarRefeicao(
          refeicoesRaw.almoco,
          "Arroz integral, feijão carioca, peito de frango grelhado e salada verde"
        ),
        lanche_tarde: normalizarRefeicao(
          refeicoesRaw.lanche_tarde,
          "Iogurte natural desnatado com castanhas"
        ),
        jantar: normalizarRefeicao(
          refeicoesRaw.jantar,
          "Omelete de legumes com salada colorida"
        ),
      },
    };
  });

  return { plano_semanal: normalizado };
}

export async function gerarPlanoComIA(dadosPacienteInput: any): Promise<PlanoSemanalConteudo> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no servidor. Verifique o arquivo .env no backend."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const dadosFormatados = formatarDadosPaciente(dadosPacienteInput);
  const prompt = construirPromptInterno(dadosFormatados);

  // Lista de modelos priorizando gemini-3.8-flash conforme solicitado, com fallback resiliente para picos de demanda
  const modelosCandidatos = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
  ];

  let ultimoErro: any = null;

  for (const modeloNome of modelosCandidatos) {
    try {
      const model = genAI.getGenerativeModel({
        model: modeloNome,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: MEAL_SCHEMA,
          temperature: 0.4,
        },
      });

      const response = await model.generateContent(prompt);
      const rawText = response.response.text();

      // Sanitização e validação segura com try/catch
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (errJson) {
        // Tentativa de remover possíveis wrappers inesperados
        const limpo = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(limpo);
      }

      const planoValidado = normalizarPlanoSemanal(parsed);
      return planoValidado;
    } catch (err: any) {
      ultimoErro = err;
      const isDemandError =
        err?.status === 503 ||
        err?.status === 429 ||
        String(err?.message || "").includes("demand") ||
        String(err?.message || "").includes("Service Unavailable");

      if (isDemandError) {
        console.warn(
          `[gerar-plano] Modelo ${modeloNome} indisponível temporariamente (${err.status || err.message}). Tentando fallback...`
        );
        continue;
      }

      // Se for outro erro grave, encerra para não insistir à toa
      console.error(`[gerar-plano] Erro ao gerar com modelo ${modeloNome}:`, err);
      break;
    }
  }

  throw new Error(
    ultimoErro?.message ||
      "Falha ao gerar o plano alimentar com IA após consultar os modelos disponíveis."
  );
}

// Handler padrão compatível com Node HTTP / Vite connect / Vercel Serverless
export async function handleGerarPlano(req: IncomingMessage, res: ServerResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      let parsedBody: any = {};
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Corpo da requisição deve ser um JSON válido." }));
          return;
        }
      }

      const dados =
        parsedBody.dados_do_paciente ||
        parsedBody.paciente ||
        parsedBody;

      const plano = await gerarPlanoComIA(dados);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, plano }));
    } catch (err: any) {
      console.error("[api/gerar-plano] Erro na execução:", err);
      const statusCode = err?.status === 503 ? 503 : 500;
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error:
            err?.message ||
            "Não foi possível gerar o plano com IA no momento.",
        })
      );
    }
  });
}

// Export default para ambiente Serverless Vercel
export default async function handler(req: any, res: any) {
  return handleGerarPlano(req, res);
}
