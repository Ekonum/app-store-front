<template>
  <div id="app">
    <header>
      <h1>App Store K3s</h1>
    </header>
    <main>
      <div class="section">
        <h2>Applications Disponibles</h2>
        <div v-if="chartsLoading">Chargement des charts...</div>
        <div v-if="chartsError" class="error-message">{{ chartsError }}</div>
        <div v-if="availableCharts.length" class="card-container">
          <ChartCard
              v-for="chart in availableCharts"
              :key="chart.name"
              :chart="chart"
              @chartInstalled="fetchInstalledReleases"
          />
        </div>
        <div v-else-if="!chartsLoading && !chartsError">Aucun chart disponible.</div>
      </div>

      <div class="section">
        <h2>Applications Installées</h2>
        <button :disabled="releasesLoading" class="refresh-button" @click="fetchInstalledReleases">
          {{ releasesLoading ? 'Rafraîchissement...' : 'Rafraîchir la liste' }}
        </button>
        <div v-if="releasesLoading">Chargement des releases...</div>
        <div v-if="releasesError" class="error-message">{{ releasesError }}</div>
        <div v-if="installedReleases.length" class="card-container">
          <ReleaseCard
              v-for="release in installedReleases"
              :key="release.name"
              :release="release"
              @releaseUninstalled="fetchInstalledReleases"
          />
        </div>
        <div v-else-if="!releasesLoading && !releasesError">Aucune application installée.</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import axios from 'axios';
import ChartCard from './components/ChartCard.vue';
import ReleaseCard from './components/ReleaseCard.vue';

const availableCharts = ref([]);
const installedReleases = ref([]);
const chartsLoading = ref(false);
const chartsError = ref('');
const releasesLoading = ref(false);
const releasesError = ref('');

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

async function fetchAvailableCharts() {
  chartsLoading.value = true;
  chartsError.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/charts`);
    availableCharts.value = response.data;
  } catch (error) {
    console.error("Erreur de récupération des charts:", error);
    chartsError.value = error.response?.data?.error || error.message || "Impossible de charger les charts disponibles.";
  } finally {
    chartsLoading.value = false;
  }
}

async function fetchInstalledReleases() {
  releasesLoading.value = true;
  releasesError.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/releases`);
    installedReleases.value = response.data.sort((a, b) => new Date(b.updated) - new Date(a.updated));
  } catch (error) {
    console.error("Erreur de récupération des releases:", error);
    releasesError.value = error.response?.data?.error || error.message || "Impossible de charger les releases installées.";
  } finally {
    releasesLoading.value = false;
  }
}

onMounted(() => {
  fetchAvailableCharts();
  fetchInstalledReleases();
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

.section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin-top: 0;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
}

.error-message {
  color: red;
  font-weight: bold;
}

.refresh-button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.refresh-button:disabled {
  background-color: #ccc;
}

.refresh-button:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>