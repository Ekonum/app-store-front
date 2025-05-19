<template>
  <div :class="`status-${release.status.toLowerCase()}`" class="card release-card">
    <h3>{{ release.name }}</h3>
    <p><small>Chart: {{ release.chart }} (App v{{ release.app_version }}) - Release v{{ release.version }}</small></p>
    <p>Namespace: {{ release.namespace }}</p>
    <p>Statut: <span class="status">{{ release.status }}</span> (Mis à jour:
      {{ new Date(release.updated).toLocaleString() }})</p>
    <button :disabled="isLoadingDetails" @click="showDetails">
      {{ isLoadingDetails ? 'Chargement...' : 'Détails' }}
    </button>
    <button :disabled="isUninstalling" class="uninstall-button" @click="uninstallRelease">
      {{ isUninstalling ? 'Désinstallation...' : 'Désinstaller' }}
    </button>
    <p v-if="actionMessage" :class="{ 'error-message': actionError }">{{ actionMessage }}</p>
    <div v-if="details" class="details-panel">
      <h4>Détails de la Release:</h4>
      <pre>{{ JSON.stringify(details, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import axios from 'axios';

const props = defineProps({
  release: Object
});

const emit = defineEmits(['releaseUninstalled']);

const isUninstalling = ref(false);
const isLoadingDetails = ref(false);
const actionMessage = ref('');
const actionError = ref(false);
const details = ref(null);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

async function uninstallRelease() {
  if (!confirm(`Êtes-vous sûr de vouloir désinstaller ${props.release.name} ?`)) {
    return;
  }
  isUninstalling.value = true;
  actionMessage.value = '';
  actionError.value = false;
  details.value = null;
  try {
    const response = await axios.delete(`${apiBaseUrl}/releases/${props.release.name}`);
    actionMessage.value = response.data.message || "Désinstallation réussie.";
    emit('releaseUninstalled');
  } catch (error) {
    console.error("Erreur de désinstallation:", error);
    actionMessage.value = error.response?.data?.error || error.message || "Erreur lors de la désinstallation.";
    actionError.value = true;
  } finally {
    isUninstalling.value = false;
    setTimeout(() => {
      actionMessage.value = '';
    }, 5000);
  }
}

async function showDetails() {
  if (details.value) { // Toggle off if already shown
    details.value = null;
    return;
  }
  isLoadingDetails.value = true;
  actionMessage.value = '';
  actionError.value = false;
  try {
    const response = await axios.get(`${apiBaseUrl}/releases/${props.release.name}/status`);
    details.value = response.data;
  } catch (error) {
    console.error("Erreur détails:", error);
    actionMessage.value = error.response?.data?.error || error.message || "Erreur lors de la récupération des détails.";
    actionError.value = true;
  } finally {
    isLoadingDetails.value = false;
  }
}
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  padding: 16px;
  margin: 8px;
  border-radius: 4px;
}

.release-card {
  background-color: #eef;
}

.status-deployed, .status-superseded {
  border-left: 5px solid green;
}

.status-failed {
  border-left: 5px solid red;
}

.status-pending-install, .status-pending-upgrade, .status-pending-rollback {
  border-left: 5px solid orange;
}

.status {
  font-weight: bold;
}

.error-message {
  color: red;
}

.uninstall-button {
  background-color: #f44336;
}

.uninstall-button:hover:not(:disabled) {
  background-color: #da190b;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

button:disabled {
  background-color: #ccc;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

.details-panel {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px dashed #ccc;
  max-height: 300px;
  overflow-y: auto;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>