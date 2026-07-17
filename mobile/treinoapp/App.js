import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

const FILE_PATH = FileSystem.documentDirectory + 'treino_ai_data.json';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function App() {
  const [userId, setUserId] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [idade, setIdade] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [tempo, setTempo] = useState(30); // Define 30 min como padrao do slider
  
  // URL da API customizável (com padrão baseado no ambiente)
  const [backendUrl, setBackendUrl] = useState(
    Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'
  );
  const [apiKey, setApiKey] = useState('');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [exibirHistorico, setExibirHistorico] = useState(false);

  const [loading, setLoading] = useState(false);
  const [treino, setTreino] = useState(null);

  // Carrega configurações e dados do usuário salvos localmente
  useEffect(() => {
    const carregarDadosLocais = async () => {
      try {
        let dadosString = null;
        if (Platform.OS === 'web') {
          dadosString = window.localStorage.getItem('treino_ai_data');
        } else {
          const info = await FileSystem.getInfoAsync(FILE_PATH);
          if (info.exists) {
            dadosString = await FileSystem.readAsStringAsync(FILE_PATH);
          }
        }

        if (dadosString) {
          const dados = JSON.parse(dadosString);
          if (dados.userId) setUserId(dados.userId);
          if (dados.objetivo) setObjetivo(dados.objetivo);
          if (dados.idade) setIdade(dados.idade.toString());
          if (dados.peso) setPeso(dados.peso.toString());
          if (dados.altura) setAltura(dados.altura.toString());
          if (dados.frequencia) setFrequencia(dados.frequencia.toString());
          if (dados.tempo) setTempo(Number(dados.tempo));
          if (dados.backendUrl) setBackendUrl(dados.backendUrl);
          if (dados.apiKey) setApiKey(dados.apiKey);
          if (dados.treino) setTreino(dados.treino);
        } else {
          // Primeira execução: gera um ID único para o usuário
          setUserId(generateUUID());
        }
      } catch (error) {
        console.warn('Erro ao carregar dados locais:', error);
        setUserId(generateUUID());
      }
    };

    carregarDadosLocais();
  }, []);

  // Salva dados fisicos do usuário e configurações localmente
  const salvarDadosLocais = async (dadosNovos) => {
    try {
      const dadosParaSalvar = {
        userId: dadosNovos.userId || userId || generateUUID(),
        objetivo: dadosNovos.objetivo ?? objetivo,
        idade: dadosNovos.idade ?? idade,
        peso: dadosNovos.peso ?? peso,
        altura: dadosNovos.altura ?? altura,
        frequencia: dadosNovos.frequencia ?? frequencia,
        tempo: dadosNovos.tempo ?? tempo,
        backendUrl: dadosNovos.backendUrl ?? backendUrl,
        apiKey: dadosNovos.apiKey ?? apiKey,
        treino: dadosNovos.treino !== undefined ? dadosNovos.treino : treino,
      };

      if (Platform.OS === 'web') {
        window.localStorage.setItem('treino_ai_data', JSON.stringify(dadosParaSalvar));
      } else {
        await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(dadosParaSalvar));
      }
    } catch (error) {
      console.warn('Erro ao salvar dados locais:', error);
    }
  };

  // Gerador de treino local (funciona sem servidor)
  const gerarTreinoLocal = () => {
    const freq = Number(frequencia) || 3;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
    const obj = objetivo.toLowerCase();

    const focos = obj.includes('perna') || obj.includes('inferior')
      ? ['Pernas e Glúteos', 'Costas e Bíceps', 'Peito e Tríceps', 'Ombros e Core', 'Pernas (volume)', 'Cardio']
      : obj.includes('superior') || obj.includes('braço')
      ? ['Peito e Tríceps', 'Costas e Bíceps', 'Ombros e Antebraço', 'Braços (isolados)', 'Full Body', 'Cardio']
      : obj.includes('emagrec') || obj.includes('cardio')
      ? ['Cardio + Core', 'Superiores Funcional', 'Inferiores Funcional', 'HIIT + Abdômen', 'Full Body Metabólico', 'Cardio Leve']
      : ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas e Glúteos', 'Ombros e Core', 'Full Body', 'Cardio'];

    const bases = {
      'Peito e Tríceps': `Aquecimento: 5 min\nSupino Reto 4x10\nSupino Inclinado 3x12\nCrucifixo 3x12\nTríceps Polia 4x12\nTríceps Mergulho 3x15\nAbdômen Prancha 3x1min\n\nTempo estimado: ${tempo} min`,
      'Costas e Bíceps': `Aquecimento: 5 min\nPuxada Frontal 4x10\nRemada Curvada 4x10\nRemada Unilateral 3x12\nRosca Direta 4x12\nRosca Martelo 3x12\nAbdômen Supra 3x20\n\nTempo estimado: ${tempo} min`,
      'Pernas e Glúteos': `Aquecimento: 5 min\nAgachamento Livre 4x10\nLeg Press 4x12\nCadeira Extensora 3x15\nCadeira Flexora 3x15\nStiff 3x12\nPanturrilha em pé 4x15\n\nTempo estimado: ${tempo} min`,
      'Ombros e Core': `Aquecimento: 5 min\nDesenvolvimento Halteres 4x10\nElevação Lateral 4x12\nElevação Frontal 3x12\nFace Pull 3x15\nPrancha 3x1min\nAbdômen Bicicleta 3x20\n\nTempo estimado: ${tempo} min`,
      'Full Body': `Aquecimento: 5 min\nAgachamento 3x10\nSupino 3x10\nRemada 3x10\nDesenvolvimento 3x10\nRosca Direta 2x12\nTríceps 2x12\nPrancha 2x1min\n\nTempo estimado: ${tempo} min`,
      'Cardio': `Aquecimento: 5 min caminhada\nEsteira (corrida leve) 15 min\nBike Ergométrica 10 min\nAbdômen Supra 3x20\nPrancha 3x1min\nAlongamento final: 5 min\n\nTempo estimado: ${tempo} min`,
      'Cardio + Core': `Aquecimento: 5 min\nEsteira Intervalada 20 min\nPrancha Lateral 3x45s\nAbdômen com Elevação de Perna 3x15\nSitups 3x20\nAlongamento: 5 min\n\nTempo estimado: ${tempo} min`,
      'Superiores Funcional': `Aquecimento: 5 min\nFlexão de Braço 3x15\nPuxada na Barra 3x10\nDips 3x12\nRosca com Elástico 3x15\nElevação de Ombros 3x12\nPrancha 3x1min\n\nTempo estimado: ${tempo} min`,
      'Inferiores Funcional': `Aquecimento: 5 min\nAgachamento Poltrona 4x15\nPassada 3x12 cada perna\nElevação de Quadril 4x15\nSaltito no Lugar 3x20\nPanturrilha 4x20\nAlongamento: 5 min\n\nTempo estimado: ${tempo} min`,
      'HIIT + Abdômen': `Aquecimento: 3 min\nBurpee 4x10 (30s descanso)\nMountain Climber 4x20\nPolichinelo 3x30\nAbdômen Bicicleta 3x20\nPrancha 3x1min\nAlongamento: 3 min\n\nTempo estimado: ${tempo} min`,
      'Full Body Metabólico': `Aquecimento: 5 min\nAgachamento + Press 3x12\nRemo + Rosca 3x12\nPassada + Curl 3x10\nPrancha com Rotação 3x12\nEstrela com Salto 3x15\nAlongamento: 5 min\n\nTempo estimado: ${tempo} min`,
      'Cardio Leve': `Aquecimento: 5 min\nCaminhada Rápida 20 min\nAlongamento Ativo 10 min\nAbdômen Supra 2x15\nPrancha 2x45s\nDescanso Ativo\n\nTempo estimado: ${tempo} min`,
      'Pernas (volume)': `Aquecimento: 5 min\nAgachamento Livre 5x8\nLeg Press 4x12\nHack Squat 3x15\nStiff 3x12\nGlúteo Cabo 4x15\nPanturrilha 5x15\n\nTempo estimado: ${tempo} min`,
      'Braços (isolados)': `Aquecimento: 5 min\nRosca Direta 5x10\nRosca Martelo 4x12\nRosca Concentrada 3x12\nTríceps Polia 5x10\nTríceps Testa 4x10\nTríceps Mergulho 3x12\n\nTempo estimado: ${tempo} min`,
      'Ombros e Antebraço': `Aquecimento: 5 min\nDesenvolvimento Máquina 4x10\nElevação Lateral 4x12\nPássaro 3x15\nElencagem De Barra 4x15\nFlexão De Pulso 3x15\nExtensão De Pulso 3x15\n\nTempo estimado: ${tempo} min`,
    };

    return Array.from({ length: freq }, (_, i) => {
      const foco = focos[i % focos.length];
      return {
        dia: `Treino ${letras[i]}`,
        foco: foco,
        exercicios: bases[foco] || bases['Full Body'],
      };
    });
  };

  const gerarTreino = async () => {
    if (!objetivo.trim() || !frequencia.trim()) return;
    setLoading(true);

    const dadosEnvio = {
      user_id: userId || generateUUID(),
      objetivo,
      idade: Number(idade) || 25,
      peso: Number(peso) || 70,
      altura: Number(altura) || 170,
      vezes_por_semana: Number(frequencia),
      tempo,
      nivel: 'intermediario',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${backendUrl}/gerar-treino-ia`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Treino-Key': apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify(dadosEnvio),
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Erro na API');

      const lista = Array.isArray(data) ? data : (data.treino || []);
      if (lista.length > 0) {
        setTreino(lista);
        salvarDadosLocais({
          userId: dadosEnvio.user_id,
          treino: lista,
        });
        return;
      }
      throw new Error('Resposta vazia');
    } catch (error) {
      console.warn('Conectando ao fallback local devido a:', error.message);
      // Servidor não disponível ou erro — usa o gerador local
      const treinoGeradoLocal = gerarTreinoLocal();
      setTreino(treinoGeradoLocal);
      salvarDadosLocais({
        userId: dadosEnvio.user_id,
        treino: treinoGeradoLocal,
      });
      Alert.alert(
        'Modo Offline/Fallback',
        'Não foi possível conectar à API. Um treino padrão foi gerado localmente e salvo no seu perfil.'
      );
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    if (!userId) return;
    setLoadingHistorico(true);
    try {
      const response = await fetch(`${backendUrl}/historico/${userId}`, {
        headers: {
          'X-Treino-Key': apiKey,
        }
      });
      if (!response.ok) throw new Error('Não foi possível carregar o histórico');
      const data = await response.json();
      setHistorico(data);
      setExibirHistorico(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar seu histórico do servidor Neon: ' + error.message);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const selecionarTreinoHistorico = (treinoHistorico) => {
    // Converte os dados do histórico para o formato da UI
    const treinoFormatado = treinoHistorico.days.map(d => ({
      dia: d.dia,
      foco: d.foco,
      exercicios: d.exercicios,
    }));
    setTreino(treinoFormatado);
    setExibirHistorico(false);
    salvarDadosLocais({ treino: treinoFormatado });
    Alert.alert('Sucesso', 'Treino antigo carregado no perfil!');
  };

  const limparTreino = () => {
    setTreino(null);
    setObjetivo('');
    setIdade('');
    setPeso('');
    setAltura('');
    setFrequencia('');
    setTempo(30);
    salvarDadosLocais({
      objetivo: '',
      idade: '',
      peso: '',
      altura: '',
      frequencia: '',
      tempo: 30,
      treino: null,
    });
  };

  const exportarExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      const planilha = [];

      planilha.push(['🏋️ TREINO SEMANAL - TREINO.AI', '', '']);
      planilha.push(['Objetivo', objetivo, '']);
      planilha.push(['Frequência', `${frequencia}x por semana`, `Tempo por sessão: ${tempo} min`]);
      planilha.push(['', '', '']);

      treino.forEach((dia) => {
        planilha.push([dia.dia.toUpperCase(), dia.foco, '']);
        planilha.push(['Exercício', '', '']);
        const linhas = (dia.exercicios || '').split('\n').filter(Boolean);
        linhas.forEach((linha) => planilha.push(['', linha, '']));
        planilha.push(['', '', '']);
      });

      planilha.push(['── PERFIL DO USUÁRIO ──', '', '']);
      planilha.push(['Idade', `${idade} anos`, '']);
      planilha.push(['Peso', `${peso} kg`, '']);
      planilha.push(['Altura', `${altura} cm`, '']);

      const ws = XLSX.utils.aoa_to_sheet(planilha);
      ws['!cols'] = [{ wch: 20 }, { wch: 55 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, ws, 'Treino Semanal');

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Treino_Semanal.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const filePath = FileSystem.documentDirectory + 'Treino_Semanal.xlsx';
        await FileSystem.writeAsStringAsync(filePath, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const podeCompartilhar = await Sharing.isAvailableAsync();
        if (podeCompartilhar) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Salvar ou Compartilhar seu Treino',
            UTI: 'com.microsoft.excel.xlsx',
          });
        } else {
          Alert.alert('Arquivo salvo!', `Salvo em: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      Alert.alert('Erro', 'Não foi possível exportar a planilha: ' + error.message);
    }
  };

  const formValido = objetivo.trim() && idade && peso && altura && frequencia;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2D" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Treino.AI</Text>
                <Text style={styles.headerSubtitle}>Seu treino sob medida</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.configButton} 
                  onPress={() => setMostrarConfig(!mostrarConfig)}
                >
                  <Text style={styles.configButtonText}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Painel de Configurações */}
            {mostrarConfig && (
              <View style={styles.configPanel}>
                <Text style={styles.configLabel}>IP / URL do Servidor API (Ex: http://192.168.1.50:8000)</Text>
                <TextInput
                  style={styles.configInput}
                  placeholder="http://localhost:8000"
                  placeholderTextColor="#8892b0"
                  value={backendUrl}
                  onChangeText={(text) => {
                    setBackendUrl(text);
                    salvarDadosLocais({ backendUrl: text });
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <Text style={styles.configLabel}>Chave da API (Opcional se configurado no servidor)</Text>
                <TextInput
                  style={styles.configInput}
                  placeholder="Insira sua chave de API aqui"
                  placeholderTextColor="#8892b0"
                  value={apiKey}
                  onChangeText={(text) => {
                    setApiKey(text);
                    salvarDadosLocais({ apiKey: text });
                  }}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <Text style={styles.configHelp}>
                  Seu ID único (PostgreSQL): <Text style={styles.uuidText}>{userId}</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.buttonHistory} 
                  onPress={carregarHistorico}
                  disabled={loadingHistorico}
                >
                  {loadingHistorico ? (
                    <ActivityIndicator color="#FFD700" size="small" />
                  ) : (
                    <Text style={styles.buttonHistoryText}>☁️ Carregar Histórico do Neon</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Histórico Modal/View */}
          {exibirHistorico && (
            <View style={styles.historicoContainer}>
              <View style={styles.historicoHeader}>
                <Text style={styles.historicoTitle}>Seus Treinos Salvos (Neon.tech)</Text>
                <TouchableOpacity onPress={() => setExibirHistorico(false)}>
                  <Text style={styles.closeText}>Fechar ✕</Text>
                </TouchableOpacity>
              </View>
              {historico.length === 0 ? (
                <Text style={styles.historicoVazio}>Nenhum treino salvo encontrado no servidor.</Text>
              ) : (
                historico.map((h, i) => (
                  <View key={i} style={styles.historicoCard}>
                    <View>
                      <Text style={styles.historicoCardDate}>
                        Salvo em: {new Date(h.created_at).toLocaleDateString('pt-BR')} às {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.historicoCardDetails}>
                        {h.days.length} sessões divididas
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.historicoLoadBtn} 
                      onPress={() => selecionarTreinoHistorico(h)}
                    >
                      <Text style={styles.historicoLoadBtnText}>Carregar</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Área de Entrada */}
          {!treino ? (
            <View style={styles.inputSection}>
              <Text style={styles.label}>Qual o seu objetivo?</Text>
              <TextInput
                style={styles.inputArea}
                placeholder="Ex: Quero emagrecer e definir..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                value={objetivo}
                onChangeText={(text) => {
                  setObjetivo(text);
                  salvarDadosLocais({ objetivo: text });
                }}
              />

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.labelSmall}>Idade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={idade}
                    onChangeText={(text) => {
                      setIdade(text);
                      salvarDadosLocais({ idade: text });
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { marginLeft: 15 }]}>
                  <Text style={styles.labelSmall}>Peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={peso}
                    onChangeText={(text) => {
                      setPeso(text);
                      salvarDadosLocais({ peso: text });
                    }}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.labelSmall}>Altura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="175"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={altura}
                    onChangeText={(text) => {
                      setAltura(text);
                      salvarDadosLocais({ altura: text });
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { marginLeft: 15 }]}>
                  <Text style={styles.labelSmall}>Dias/Semana</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={frequencia}
                    onChangeText={(text) => {
                      setFrequencia(text);
                      salvarDadosLocais({ frequencia: text });
                    }}
                  />
                </View>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.label}>Tempo por treino</Text>
                <View style={styles.timeSelector}>
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => {
                      const novo = Math.max(15, tempo - 5);
                      setTempo(novo);
                      salvarDadosLocais({ tempo: novo });
                    }}
                  >
                    <Text style={styles.timeButtonText}>-</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.timeValueContainer}>
                    <Text style={styles.timeValueText}>{tempo}</Text>
                    <Text style={styles.timeLabelText}>min</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => {
                      const novo = Math.min(120, tempo + 5);
                      setTempo(novo);
                      salvarDadosLocais({ tempo: novo });
                    }}
                  >
                    <Text style={styles.timeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, !formValido && styles.buttonDisabled]} 
                onPress={gerarTreino}
                disabled={!formValido || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Gerar Meu Treino</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Área de Resultados */
            <View style={styles.resultSection}>
              <Text style={styles.successTitle}>Treino Ativo Gerado!</Text>
              <Text style={styles.successSubtitle}>Tempo Foco: {tempo} min | Frequência: {frequencia}x na semana</Text>
              
              {treino.map((diaInfo, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDay}>{diaInfo.dia}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{diaInfo.foco}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardExercises}>{diaInfo.exercicios}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.buttonExcel} onPress={exportarExcel}>
                <Text style={styles.buttonExcelText}>📥  Baixar Planilha Excel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buttonOutline} onPress={limparTreino}>
                <Text style={styles.buttonOutlineText}>Ajustar Perfil</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    backgroundColor: '#112240',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#8892b0',
    fontSize: 16,
    marginTop: 5,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  configButton: {
    backgroundColor: '#233554',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#495670',
  },
  configButtonText: {
    fontSize: 22,
  },
  configPanel: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#233554',
  },
  configLabel: {
    color: '#a8b2d1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  configInput: {
    backgroundColor: '#0a192f',
    borderRadius: 10,
    padding: 12,
    color: '#e6f1ff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#495670',
    marginBottom: 10,
  },
  configHelp: {
    color: '#8892b0',
    fontSize: 11,
    marginBottom: 12,
  },
  uuidText: {
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonHistory: {
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  buttonHistoryText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historicoContainer: {
    margin: 20,
    backgroundColor: '#112240',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  historicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#233554',
    paddingBottom: 10,
  },
  historicoTitle: {
    color: '#e6f1ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  historicoVazio: {
    color: '#8892b0',
    textAlign: 'center',
    marginVertical: 10,
  },
  historicoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#233554',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historicoCardDate: {
    color: '#e6f1ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historicoCardDetails: {
    color: '#a8b2d1',
    fontSize: 11,
    marginTop: 2,
  },
  historicoLoadBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  historicoLoadBtnText: {
    color: '#0A192F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputSection: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    color: '#e6f1ff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  labelSmall: {
    color: '#a8b2d1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputArea: {
    backgroundColor: '#233554',
    borderRadius: 15,
    padding: 16,
    color: '#e6f1ff',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#495670',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#233554',
    borderRadius: 12,
    padding: 14,
    color: '#e6f1ff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#495670',
    marginBottom: 24,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#233554',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#495670',
  },
  timeButton: {
    backgroundColor: '#112240',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#495670',
  },
  timeButtonText: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -4,
  },
  timeValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValueText: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  timeLabelText: {
    color: '#8892b0',
    fontSize: 14,
    fontWeight: '500',
    marginTop: -5,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#495670',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#0A192F',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultSection: {
    padding: 20,
  },
  successTitle: {
    color: '#e6f1ff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  successSubtitle: {
    color: '#8892b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#112240',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDay: {
    color: '#e6f1ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardExercises: {
    color: '#a8b2d1',
    lineHeight: 24,
    fontSize: 15,
  },
  buttonOutline: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonExcel: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#1a6b3c',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#1a6b3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonExcelText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});