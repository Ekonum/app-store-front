<template>
  <div :class="`status-${release.status.toLowerCase().replace(' ', '-')}`" class="card release-card">
    <h3>{{ release.name }}</h3>
    <p><small>Chart: {{ release.chart }} (App v{{ release.app_version }}) - Release v{{ release.version }}</small></p>
    <p>Namespace: {{ release.namespace }}</p>
    <p>Statut: <span class="status">{{ release.status }}</span> (Mis à jour:
      {{ new Date(release.updated).toLocaleString() }})</p>
    <div class="actions">
      <button :disabled="isLoadingDetails" class="details-button" @click="showDetails">
        {{ isLoadingDetails ? 'Chargement...' : (details ? 'Cacher Détails' : 'Afficher Détails') }}
      </button>
      <button :disabled="isUninstalling" class="uninstall-button" @click="uninstallRelease">
        {{ isUninstalling ? 'Désinstallation...' : 'Désinstaller' }}
      </button>
    </div>
    <p v-if="actionMessage" :class="{ 'error-message': actionError, 'success-message': !actionError && actionMessage }">
      {{ actionMessage }}</p>
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
  details.value = null; // Cacher les détails pendant la désinstallation
  try {
    const response = await axios.delete(`${apiBaseUrl}/releases/${props.release.name}`);
    actionMessage.value = response.data.message || "Désinstallation réussie.";
    // Pas besoin d'émettre ici si on va rafraîchir globalement après un délai
    setTimeout(() => {
      emit('releaseUninstalled'); // Émettre après un petit délai pour laisser le message s'afficher
      actionMessage.value = '';
    }, 2000);

  } catch (error) {
    console.error("Erreur de désinstallation:", error);
    actionMessage.value = error.response?.data?.error || error.message || "Erreur lors de la désinstallation.";
    actionError.value = true;
    setTimeout(() => {
      actionMessage.value = '';
    }, 7000);
  } finally {
    isUninstalling.value = false;
  }
}

async function showDetails() {
  if (details.value) {
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
    setTimeout(() => {
      actionMessage.value = '';
    }, 7000);
  } finally {
    isLoadingDetails.value = false;
  }
}
</script>

<style scoped>
.card {
  border: 1px solid var(--border-color, #e0e0e0);
  padding: 16px;
  margin: 0; /* Sera géré par le gap du container parent */
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  width: calc(33.333% - 11px); /* Pour 3 cartes par ligne avec gap de 16px */
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .card {
    width: calc(50% - 8px); /* 2 cartes par ligne */
  }
}

@media (max-width: 600px) {
  .card {
    width: 100%; /* 1 carte par ligne */
  }
}

.card h3 {
  margin-top: 0;
  color: var(--ekonum-dark-gray, #333);
}

.release-card {
  /* background-color: #eef; */ /* Couleur de fond plus neutre */
}
.status-deployed, .status-superseded {
  border-left: 5px solid var(--success-color, green);
}
.status-failed {
  border-left: 5px solid var(--error-color, red);
}

.status-pending-install, .status-pending-upgrade, .status-pending-rollback, .status-uninstalled, .status-uninstalling {
  border-left: 5px solid orange;
}
.status {
  font-weight: bold;
}
.error-message {
  color: var(--error-color, red);
  font-size: 0.9em;
  margin-top: 8px;
}

.success-message {
  color: var(--success-color, green);
  font-size: 0.9em;
  margin-top: 8px;
}

.actions {
  margin-top: 10px;
  margin-bottom: 10px;
}
button {
  color: var(--button-text-color, white);
  padding: 8px 12px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.details-button {
  background-color: var(--ekonum-blue, #3B8AC4);
}

.details-button:hover:not(:disabled) {
  background-color: #2A6F9E;
}

.uninstall-button {
  background-color: var(--error-color, #f44336);
}

.uninstall-button:hover:not(:disabled) {
  background-color: #c32f27; /* Rouge plus foncé pour le hover */
}

.details-panel {
  margin-top: 10px;
  padding: 10px;
  background-color: var(--light-bg, #f9f9f9);
  border: 1px dashed #ccc;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.85em;
}
</style>