<template>
  <div id="app">
    <header>
      <img alt="Ekonum Logo" class="logo" src="./assets/ekonum-logo.png"/>
      <h1>App Store K3s</h1>
    </header>
    <main>
      <div class="section">
        <h2>Available Applications</h2>
        <div v-if="chartsLoading">Loading charts...</div>
        <div v-if="chartsError" class="error-message">{{ chartsError }}</div>
        <div v-if="availableCharts.length" class="card-container">
          <ChartCard
              v-for="chart in availableCharts"
              :key="chart.name"
              :chart="chart"
              @chartInstalled="fetchInstalledReleases"
          />
        </div>
        <div v-else-if="!chartsLoading && !chartsError">No charts available.</div>
      </div>

      <div class="section">
        <h2>Installed Applications</h2>
        <button :disabled="releasesLoading" class="refresh-button" @click="fetchInstalledReleases">
          {{ releasesLoading ? 'Refreshing...' : 'Refresh List' }}
        </button>
        <div v-if="releasesLoading">Loading releases...</div>
        <div v-if="releasesError" class="error-message">{{ releasesError }}</div>
        <div v-if="installedReleases.length" class="card-container">
          <ReleaseCard
              v-for="release in installedReleases"
              :key="release.name"
              :release="release"
              @releaseUninstalled="fetchInstalledReleases"
          />
        </div>
        <div v-else-if="!releasesLoading && !releasesError">No applications installed.</div>
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_PATH;

async function fetchAvailableCharts() {
  chartsLoading.value = true;
  chartsError.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/charts`);
    availableCharts.value = response.data;
  } catch (error) {
    console.error("Error retrieving charts:", error);
    chartsError.value = error.response?.data?.error || error.message || "Unable to load available charts.";
  } finally {
    chartsLoading.value = false;
  }
}

async function fetchInstalledReleases() {
  releasesLoading.value = true;
  releasesError.value = '';
  try {
    const response = await axios.get(`${apiBaseUrl}/releases`);
    if (Array.isArray(response.data)) {
      installedReleases.value = response.data.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    } else {
      installedReleases.value = [];
      if (response.data !== null && response.data !== undefined) {
        console.warn("Received non-compliant data for releases (array expected):", response.data);
      }
    }
  } catch (error) {
    console.error("Error retrieving releases:", error);
    releasesError.value = error.response?.data?.error || error.message || "Unable to load installed releases.";
    installedReleases.value = [];
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
:root {
  --ekonum-blue: #3B8AC4;
  --ekonum-dark-gray: #333333;
  --text-color: #2c3e50;
  --light-bg: #f9f9f9;
  --border-color: #e0e0e0;
  --success-color: #4CAF50;
  --error-color: #f44336;
  --button-text-color: white;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}
header {
  display: flex; /* To align logo and title */
  align-items: center; /* Vertical alignment */
  justify-content: center; /* Center horizontally */
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--ekonum-blue);
}

.logo {
  height: 50px; /* Adjust based on your logo size */
  margin-right: 20px;
}

header h1 {
  color: var(--ekonum-dark-gray);
  margin: 0; /* Remove default margins from h1 */
}
.section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: white;
}
.section h2 {
  margin-top: 0;
  color: var(--ekonum-dark-gray);
  border-bottom: 2px solid var(--ekonum-blue);
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px; /* Espace entre les cartes */
}
.error-message {
  color: var(--error-color);
  font-weight: bold;
  padding: 10px;
  background-color: #ffebee;
  border: 1px solid var(--error-color);
  border-radius: 4px;
}
.refresh-button {
  background-color: var(--ekonum-blue);
  color: var(--button-text-color);
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-bottom: 15px;
  transition: background-color 0.2s ease;
}
.refresh-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.refresh-button:hover:not(:disabled) {
  background-color: #2A6F9E; /* Un bleu un peu plus foncé pour le hover */
}
</style>