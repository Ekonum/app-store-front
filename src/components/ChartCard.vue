<template>
  <div class="card">
    <h3>{{ chart.name }}</h3>
    <p><small>Chart: {{ chart.chart }} (v{{ chart.version }})</small></p>
    <p>{{ chart.description }}</p>
    <button :disabled="isInstalling" @click="installChart">
      {{ isInstalling ? 'Installation...' : 'Installer' }}
    </button>
    <p v-if="installMessage" :class="{ 'error-message': installError }">{{ installMessage }}</p>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import axios from 'axios';

const props = defineProps({
  chart: Object
});

const emit = defineEmits(['chartInstalled']);

const isInstalling = ref(false);
const installMessage = ref('');
const installError = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

async function installChart() {
  isInstalling.value = true;
  installMessage.value = '';
  installError.value = false;
  try {
    // Pour k3s et éviter le timeout du LoadBalancer, on peut forcer NodePort
    const values = {
      service: {type: "NodePort"}
    };
    // Pour nginx en particulier, si le chart s'attend à ce que `service` soit sous `nginx.service` ou autre,
    // il faudra adapter `values`. Pour bitnami/nginx, c'est direct `service.type`.

    const response = await axios.post(`${apiBaseUrl}/charts/${props.chart.name}/install`, {
      // release_name: `${props.chart.name}-${Date.now().toString().slice(-5)}`, // Optionnel: nom de release unique
      values: values // Forcer NodePort pour k3s pour une meilleure expérience avec --wait
    });
    installMessage.value = response.data.message || `Release ${response.data.release.name} en cours d'installation. Statut: ${response.data.release.status}`;
    emit('chartInstalled'); // Émettre un événement pour rafraîchir la liste des releases
  } catch (error) {
    console.error("Erreur d'installation:", error);
    installMessage.value = error.response?.data?.error || error.message || "Erreur lors de l'installation.";
    installError.value = true;
  } finally {
    isInstalling.value = false;
    setTimeout(() => {
      installMessage.value = '';
    }, 5000); // Clear message after 5s
  }
}
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  padding: 16px;
  margin: 8px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.error-message {
  color: red;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

button:disabled {
  background-color: #ccc;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}
</style>