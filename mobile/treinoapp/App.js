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
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [frequencia, setFrequencia] = useState('3');
  const [diasAberto, setDiasAberto] = useState(false); // Estado do seletor retrátil
  const [tempo, setTempo] = useState(30);
  
  const [backendUrl, setBackendUrl] = useState(
    Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'
  );
  const [apiKey, setApiKey] = useState('');
  
  // Modais e Navegação
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarConfigRede, setMostrarConfigRede] = useState(false);
  const [exibirHistorico, setExibirHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [loading, setLoading] = useState(false);
  const [treino, setTreino] = useState(null);

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
          setUserId(generateUUID());
        }
      } catch (error) {
        console.warn('Erro ao carregar dados locais:', error);
        setUserId(generateUUID());
      }
    };

    carregarDadosLocais();
  }, []);

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

  const gerarTreinoLocal = () => {
    const freq = Number(frequencia) || 3;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const obj = objetivo.toLowerCase();

    const focos = obj.includes('perna') || obj.includes('inferior')
      ? ['Pernas e Glúteos', 'Costas e Bíceps', 'Peito e Tríceps', 'Ombros e Core', 'Pernas (volume)', 'Cardio', 'Full Body']
      : obj.includes('superior') || obj.includes('braço')
      ? ['Peito e Tríceps', 'Costas e Bíceps', 'Ombros e Antebraço', 'Braços (isolados)', 'Full Body', 'Cardio', 'Core e Mobilidade']
      : obj.includes('emagrec') || obj.includes('cardio')
      ? ['Cardio + Core', 'Superiores Funcional', 'Inferiores Funcional', 'HIIT + Abdômen', 'Full Body Metabólico', 'Cardio Leve', 'Mobilidade']
      : ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas e Glúteos', 'Ombros e Core', 'Full Body', 'Cardio', 'Core e Mobilidade'];

    const bases = {
      'Peito e Tríceps': `Aquecimento: 5 min\nSupino Reto 4x10\nSupino Inclinado 3x12\nCrucifixo 3x12\nTríceps Polia 4x12\nTríceps Mergulho 3x15\nAbdômen Prancha 3x1min\n\nTempo estimado: ${tempo} min`,
      'Costas e Bíceps': `Aquecimento: 5 min\nPuxada Frontal 4x10\nRemada Curvada 4x10\nRemada Unilateral 3x12\nRosca Direta 4x12\nRosca Martelo 3x12\nAbdômen Supra 3x20\n\nTempo estimado: ${tempo} min`,
      'Pernas e Glúteos': `Aquecimento: 5 min\nAgachamento Livre 4x10\nLeg Press 4x12\nCadeira Extensora 3x15\nCadeira Flexora 3x15\nStiff 3x12\nPanturrilha em pé 4x15\n\nTempo estimado: ${tempo} min`,
      'Ombros e Core': `Aquecimento: 5 min\nDesenvolvimento Halteres 4x10\nElevação Lateral 4x12\nElevação Frontal 3x12\nFace Pull 3x15\nPrancha 3x1min\nAbdômen Bicicleta 3x20\n\nTempo estimado: ${tempo} min`,
      'Full Body': `Aquecimento: 5 min\nAgachamento 3x10\nSupino 3x10\nRemada 3x10\nDesenvolvimento 3x10\nRosca Direta 2x12\nTríceps 2x12\nPrancha 2x1min\n\nTempo estimado: ${tempo} min`,
      'Cardio': `Aquecimento: 5 min caminhada\nEsteira (corrida leve) 15 min\nBike Ergométrica 10 min\nAbdômen Supra 3x20\nPrancha 3x1min\nAlongamento final: 5 min\n\nTempo estimado: ${tempo} min`,
      'Core e Mobilidade': `Aquecimento: 5 min\nPrancha Frontal 4x1min\nPrancha Lateral 3x45s\nInfra Solo 4x15\nBicicleta 3x20\nSérie de Alongamentos 15 min\n\nTempo estimado: ${tempo} min`,
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
    if (!objetivo.trim() || !frequencia) return;
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
        headers: { 'X-Treino-Key': apiKey }
      });
      if (!response.ok) throw new Error('Não foi possível carregar o histórico');
      const data = await response.json();
      setHistorico(data);
    } catch (error) {
      console.warn('Erro ao carregar histórico:', error.message);
    } finally {
      setLoadingHistorico(false);
      setExibirHistorico(true);
    }
  };

  const selecionarTreinoHistorico = (treinoHistorico) => {
    const treinoFormatado = treinoHistorico.days.map(d => ({
      dia: d.dia,
      foco: d.foco,
      exercicios: d.exercicios,
    }));
    setTreino(treinoFormatado);
    setExibirHistorico(false);
    salvarDadosLocais({ treino: treinoFormatado });
    Alert.alert('Sucesso', 'Treino selecionado carregado na tela principal!');
  };

  const limparTreino = () => {
    setTreino(null);
    setObjetivo('');
    setIdade('');
    setPeso('');
    setAltura('');
    setFrequencia('3');
    setDiasAberto(false);
    setTempo(30);
    salvarDadosLocais({
      objetivo: '',
      idade: '',
      peso: '',
      altura: '',
      frequencia: '3',
      tempo: 30,
      treino: null,
    });
  };

  const exportarExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      const planilha = [];

      planilha.push(['🏋️ TREINO SEMANAL - HIPERTROF.IA', '', '']);
      planilha.push(['Objetivo', objetivo, '']);
      planilha.push(['Frequência', `${frequencia}x por semana`, `Tempo por sessão: ${tempo} min`]);
      planilha.push(['', '', '']);

      treino.forEach((dia) => {
        planilha.push([dia.dia.toUpperCase(), dia.foco, '']);
        const linhas = (dia.exercicios || '').split('\n').filter(Boolean);
        linhas.forEach((linha) => planilha.push(['', linha, '']));
        planilha.push(['', '', '']);
      });

      const ws = XLSX.utils.aoa_to_sheet(planilha);
      ws['!cols'] = [{ wch: 20 }, { wch: 55 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, ws, 'Treino Semanal');

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
        await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: FileSystem.EncodingType.Base64 });
        const podeCompartilhar = await Sharing.isAvailableAsync();
        if (podeCompartilhar) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Salvar ou Compartilhar seu Treino',
            UTI: 'com.microsoft.excel.xlsx',
          });
        } else {
          Alert.alert('Arquivo Salvo!', `Salvo em: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const formValido = objetivo.trim() && idade && peso && altura && frequencia;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('./assets/logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
              </View>

              <TouchableOpacity 
                style={styles.menuIconButton} 
                onPress={() => setMostrarMenu(true)}
                activeOpacity={0.6}
              >
                <Ionicons name="menu" size={28} color="#00FF66" />
              </TouchableOpacity>
            </View>
          </View>

          {/* GAVETA LATERAL (LARGURA AJUSTADA AO TAMANHO DO BOTÃO) */}
          <Modal
            visible={mostrarMenu}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setMostrarMenu(false)}
          >
            <TouchableOpacity 
              style={styles.drawerOverlay} 
              activeOpacity={1} 
              onPress={() => setMostrarMenu(false)}
            >
              <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Menu</Text>
                  <TouchableOpacity onPress={() => setMostrarMenu(false)}>
                    <Ionicons name="close" size={24} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>

                {/* Opções ajustadas com limite e sem sobras */}
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setMostrarMenu(false);
                    setMostrarConfigRede(true);
                  }}
                >
                  <Ionicons name="wifi-sharp" size={20} color="#00FF66" style={{ marginRight: 10 }} />
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.drawerItemText}>Configurações de Rede</Text>
                    <Text style={styles.drawerItemSubtext}>Servidor API e Chaves</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setMostrarMenu(false);
                    carregarHistorico();
                  }}
                >
                  <Ionicons name="fitness-sharp" size={20} color="#00FF66" style={{ marginRight: 10 }} />
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.drawerItemText}>Meus Treinos Gerados</Text>
                    <Text style={styles.drawerItemSubtext}>Histórico salvo</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* MODAL 1: Configurações de Rede */}
          <Modal
            visible={mostrarConfigRede}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setMostrarConfigRede(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Configurações de Rede</Text>
                  <TouchableOpacity onPress={() => setMostrarConfigRede(false)}>
                    <Ionicons name="close-circle" size={26} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.configLabel}>IP / URL do Servidor API</Text>
                  <TextInput
                    style={styles.configInput}
                    placeholder="http://localhost:8000"
                    placeholderTextColor="#71717A"
                    value={backendUrl}
                    onChangeText={(text) => {
                      setBackendUrl(text);
                      salvarDadosLocais({ backendUrl: text });
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <Text style={styles.configLabel}>Chave da API (Opcional)</Text>
                  <TextInput
                    style={styles.configInput}
                    placeholder="Insira sua chave de API aqui"
                    placeholderTextColor="#71717A"
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
                    ID do Dispositivo: <Text style={styles.uuidText}>{userId}</Text>
                  </Text>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* MODAL 2: Meus Treinos Gerados */}
          <Modal
            visible={exibirHistorico}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setExibirHistorico(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Meus Treinos Gerados</Text>
                  <TouchableOpacity onPress={() => setExibirHistorico(false)}>
                    <Ionicons name="close-circle" size={26} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                {loadingHistorico ? (
                  <ActivityIndicator color="#00FF66" size="large" style={{ marginVertical: 30 }} />
                ) : (
                  <ScrollView style={styles.modalBody}>
                    {historico.length === 0 ? (
                      <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <Ionicons name="barbell-outline" size={40} color="#71717A" />
                        <Text style={styles.historicoVazio}>Nenhum treino salvo no servidor.</Text>
                      </View>
                    ) : (
                      historico.map((h, i) => (
                        <View key={i} style={styles.historicoCard}>
                          <View>
                            <Text style={styles.historicoCardDate}>
                              {new Date(h.created_at).toLocaleDateString('pt-BR')}
                            </Text>
                            <Text style={styles.historicoCardDetails}>
                              {h.days ? h.days.length : 0} sessões divididas
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
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Formulário Principal */}
          {!treino ? (
            <View style={styles.inputSection}>
              <Text style={styles.label}>Qual o seu objetivo?</Text>
              <TextInput
                style={styles.inputArea}
                placeholder="Ex: Quero hipertrofia e ganho de massa..."
                placeholderTextColor="#71717A"
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
                    placeholderTextColor="#71717A"
                    keyboardType="numeric"
                    value={idade}
                    onChangeText={(text) => {
                      setIdade(text);
                      salvarDadosLocais({ idade: text });
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { marginLeft: 12 }]}>
                  <Text style={styles.labelSmall}>Peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75"
                    placeholderTextColor="#71717A"
                    keyboardType="numeric"
                    value={peso}
                    onChangeText={(text) => {
                      setPeso(text);
                      salvarDadosLocais({ peso: text });
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { marginLeft: 12 }]}>
                  <Text style={styles.labelSmall}>Altura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="175"
                    placeholderTextColor="#71717A"
                    keyboardType="numeric"
                    value={altura}
                    onChangeText={(text) => {
                      setAltura(text);
                      salvarDadosLocais({ altura: text });
                    }}
                  />
                </View>
              </View>

              {/* SELETOR RETRÁTIL DE DIAS (DROPDOWN) */}
              <View style={styles.daysContainer}>
                <Text style={styles.label}>Dias de treino por semana</Text>
                
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setDiasAberto(!diasAberto)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownHeaderText}>
                    {frequencia} {frequencia === '1' ? 'dia por semana' : 'dias por semana'}
                  </Text>
                  <Ionicons 
                    name={diasAberto ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#00FF66" 
                  />
                </TouchableOpacity>

                {diasAberto && (
                  <View style={styles.dropdownList}>
                    {['1', '2', '3', '4', '5', '6', '7'].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dropdownItem, frequencia === d && styles.dropdownItemActive]}
                        onPress={() => {
                          setFrequencia(d);
                          salvarDadosLocais({ frequencia: d });
                          setDiasAberto(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, frequencia === d && styles.dropdownItemTextActive]}>
                          {d} {d === '1' ? 'dia ' : 'dias '}
                        </Text>
                        {frequencia === d && (
                          <Ionicons name="checkmark" size={18} color="#00FF66" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
                  <ActivityIndicator color="#121212" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Gerar Meu Treino</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Resultados */
            <View style={styles.resultSection}>
              <Text style={styles.successTitle}>Treino Ativo Gerado!</Text>
              <Text style={styles.successSubtitle}>Foco: {tempo} min | Frequência: {frequencia}x na semana</Text>
              
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

// ESTILOS
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderColor: '#27272A',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    height: 40,
    width: 160,
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  menuIconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // GAVETA LATERAL AJUSTADA (Sem tamanho fixo de 50%/65%)
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#1A1A1A',
    height: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#27272A',
    maxWidth: '80%', // Limite máximo para não cobrir a tela toda
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  drawerItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  drawerItemSubtext: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  // MODAIS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 10,
  },
  configLabel: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  configInput: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
  },
  configHelp: {
    color: '#71717A',
    fontSize: 12,
    marginBottom: 16,
  },
  uuidText: {
    color: '#00FF66',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  historicoVazio: {
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 10,
  },
  historicoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historicoCardDate: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  historicoCardDetails: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  historicoLoadBtn: {
    backgroundColor: '#00FF66',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  historicoLoadBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // FORMULÁRIO PERFIL
  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 85,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  inputGroup: {
    flex: 1,
  },
  labelSmall: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  // DROPDOWN RETRÁTIL
  daysContainer: {
    marginBottom: 20,
  },
  dropdownHeader: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownHeaderText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
  },
  dropdownItemText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  dropdownItemTextActive: {
    color: '#00FF66',
    fontWeight: 'bold',
  },
  // SELETOR DE TEMPO
  sliderContainer: {
    marginBottom: 24,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  timeButton: {
    backgroundColor: '#27272A',
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonText: {
    color: '#00FF66',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValueText: {
    color: '#00FF66',
    fontSize: 26,
    fontWeight: 'bold',
  },
  timeLabelText: {
    color: '#71717A',
    fontSize: 12,
    marginTop: -4,
  },
  button: {
    backgroundColor: '#00FF66',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    backgroundColor: '#27272A',
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // CARDS DE RESULTADO
  resultSection: {
    padding: 20,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF66',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDay: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#00FF66',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardExercises: {
    color: '#D4D4D8',
    lineHeight: 22,
    fontSize: 14,
  },
  buttonExcel: {
    marginTop: 10,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonExcelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#A1A1AA',
    fontSize: 16,
  },
});