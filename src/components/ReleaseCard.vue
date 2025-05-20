<template>
  <div :class="`status-${release.status.toLowerCase().replace(' ', '-')}`" class="card release-card">
    <h3>{{ release.name }}</h3>
    <p><small>Chart: {{ release.chart }} (App v{{ release.app_version }}) - Release v{{ release.version }}</small></p>
    <p>Namespace: {{ release.namespace }}</p>
    <p>Statut: <span class="status">{{ release.status }}</span> (Mis à jour:
      {{ new Date(release.updated).toLocaleString() }})</p>

    <div v-if="accessUrl" class="access-link">
      <a :href="accessUrl" class="button-like" target="_blank">Ouvrir l'application</a>
    </div>
    <p v-else-if="Object.keys(release.node_ports || {}).length > 0" class="info-message">
      Accès via NodePort(s):
      <span v-for="(nodePort, portName) in release.node_ports" :key="portName" class="node-port-item">
        {{ portName }} -> <a :href="`http://${k3sNodeIp}:${nodePort}`" target="_blank">{{ nodePort }}</a>
      </span>
    </p>
    <p v-else-if="release.status.toLowerCase() === 'deployed'" class="info-message">
      Aucun NodePort exposé trouvé pour cette application.
    </p>

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
import {computed, ref} from 'vue'; // Ajout de computed
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
const k3sNodeIp = import.meta.env.VITE_K3S_NODE_IP; // Récupérer l'IP du noeud K3s

// Logique pour déterminer l'URL d'accès principale
const accessUrl = computed(() => {
  if (!props.release.node_ports || Object.keys(props.release.node_ports).length === 0 || !k3sNodeIp) {
    return null;
  }
  // Prioriser les noms de port communs
  const preferredPorts = ['http', 'web', 'https', '80', '8080', '443'];
  for (const preferredPortName of preferredPorts) {
    if (props.release.node_ports[preferredPortName]) {
      const protocol = (preferredPortName === 'https' || preferredPortName === '443') ? 'https' : 'http';
      return `${protocol}://${k3sNodeIp}:${props.release.node_ports[preferredPortName]}`;
    }
  }
  // Sinon, prendre le premier NodePort disponible
  const firstPortName = Object.keys(props.release.node_ports)[0];
  if (firstPortName) {
    const protocol = (firstPortName === 'https' || firstPortName === '443') ? 'https' : 'http';
    return `${protocol}://${k3sNodeIp}:${props.release.node_ports[firstPortName]}`;
  }
  return null;
});

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
    setTimeout(() => {
      emit('releaseUninstalled');
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
  position: relative;
}

.access-link {
  margin-bottom: 10px;
}

.button-like {
  display: inline-block;
  padding: 8px 12px;
  background-color: var(--success-color, #4CAF50);
  color: var(--button-text-color, white);
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.button-like:hover {
  background-color: #388E3C; /* Vert plus foncé */
}

.info-message {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 10px;
}

.node-port-item {
  margin-right: 10px;
  display: inline-block;
  padding: 2px 5px;
  background-color: #e9e9e9;
  border-radius: 3px;
}

.node-port-item a {
  color: var(--ekonum-blue);
  text-decoration: none;
  font-weight: bold;
}

.node-port-item a:hover {
  text-decoration: underline;
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