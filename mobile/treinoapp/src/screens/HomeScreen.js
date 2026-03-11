import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Alert, SafeAreaView, FlatList } from 'react-native';
import { useState } from 'react';

const IP_BACKEND = '192.168.1.11';

export default function HomeScreen() {
  const [dados, setDados] = useState({
    altura: '',
    peso: '',
    idade: '',
    vezes_por_semana: '',
    objetivo: 'hipertrofia',
    nivel: 'intermediario'
  });
  const [treino, setTreino] = useState(null);
  const [loading, setLoading] = useState(false);

  const gerarTreino = async () => {
    if (!dados.altura || !dados.peso || !dados.idade || !dados.vezes_por_semana) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://${IP_BACKEND}:8000/gerar-treino-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altura: parseFloat(dados.altura.replace(',', '.')),
          peso: parseFloat(dados.peso.replace(',', '.')),
          idade: parseInt(dados.idade),
          vezes_por_semana: parseInt(dados.vezes_por_semana),
          objetivo: dados.objetivo,
          nivel: dados.nivel
        })
      });

      const resultado = await response.json();
      setTreino(resultado);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  // Componente do cabeçalho (tudo antes da lista de treinos)
  const HeaderComponent = () => (
    <View style={styles.header}>
      <Text style={styles.titulo}>🏋️ Gerador de Treino</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📡 Conectando a: {IP_BACKEND}:8000</Text>
      </View>
      
      <TextInput 
        style={styles.input}
        placeholder="Altura (ex: 1.75)"
        value={dados.altura}
        onChangeText={(text) => setDados({...dados, altura: text})}
        keyboardType="numeric"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="Peso (kg)"
        value={dados.peso}
        onChangeText={(text) => setDados({...dados, peso: text})}
        keyboardType="numeric"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="Idade"
        value={dados.idade}
        onChangeText={(text) => setDados({...dados, idade: text})}
        keyboardType="numeric"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="Vezes por semana"
        value={dados.vezes_por_semana}
        onChangeText={(text) => setDados({...dados, vezes_por_semana: text})}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Objetivo:</Text>
      <View style={styles.botoesLinha}>
        <Button title="Hipertrofia" onPress={() => setDados({...dados, objetivo: 'hipertrofia'})} color={dados.objetivo === 'hipertrofia' ? '#007AFF' : '#999'} />
        <Button title="Definir" onPress={() => setDados({...dados, objetivo: 'definir'})} color={dados.objetivo === 'definir' ? '#007AFF' : '#999'} />
        <Button title="Emagrecer" onPress={() => setDados({...dados, objetivo: 'emagrecer'})} color={dados.objetivo === 'emagrecer' ? '#007AFF' : '#999'} />
      </View>

      <Text style={styles.label}>Nível:</Text>
      <View style={styles.botoesLinha}>
        <Button title="Iniciante" onPress={() => setDados({...dados, nivel: 'iniciante'})} color={dados.nivel === 'iniciante' ? '#007AFF' : '#999'} />
        <Button title="Intermediário" onPress={() => setDados({...dados, nivel: 'intermediario'})} color={dados.nivel === 'intermediario' ? '#007AFF' : '#999'} />
        <Button title="Avançado" onPress={() => setDados({...dados, nivel: 'avancado'})} color={dados.nivel === 'avancado' ? '#007AFF' : '#999'} />
      </View>
      
      <View style={styles.botaoGerar}>
        <Button title={loading ? "Gerando..." : "Gerar Treino"} onPress={gerarTreino} disabled={loading} />
      </View>

      {treino && treino.treino && treino.treino.length > 0 && (
        <Text style={styles.subtitulo}>Seu Treino:</Text>
      )}
    </View>
  );

  // Componente do rodapé
  const FooterComponent = () => (
    <View style={styles.footer}>
      {treino && treino.treino && (
        <View style={styles.debugArea}>
          <Text style={styles.debugTitulo}>Resposta da API:</Text>
          <Text style={styles.debugTexto}>{JSON.stringify(treino, null, 2)}</Text>
        </View>
      )}
      <View style={{ height: 50 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={treino?.treino || []}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.exercicio}>{item.exercicio || 'Exercício'}</Text>
            <Text style={styles.detalhes}>{item.series || '?'} séries x {item.repeticoes || '?'}</Text>
            {item.descanso && <Text style={styles.detalhes}>Descanso: {item.descanso}</Text>}
          </View>
        )}
        showsVerticalScrollIndicator={true}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
  },
  footer: {
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#90caf9'
  },
  infoText: {
    color: '#1976d2',
    textAlign: 'center',
    fontSize: 13
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#555'
  },
  botoesLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 5
  },
  botaoGerar: {
    marginTop: 10,
    marginBottom: 20
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  exercicio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5
  },
  detalhes: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  debugArea: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#999'
  },
  debugTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  debugTexto: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333'
  }
});