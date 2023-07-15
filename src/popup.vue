<template>
  <div class="container">
    <h1 class="display-6 my-3">twitter-sync-bluesky</h1>

    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"
          ><font-awesome-icon :icon="['fas', 'at']"
        /></span>
        <input
          type="text"
          class="form-control"
          v-model="login.userId"
          @input="v$.userId.$touch"
          @blur="v$.userId.$touch"
          placeholder="username or email address" />
      </div>

      <div v-for="e of v$.userId.$errors" :key="e.$uid">
        <span class="text-danger">{{ e.$message }}</span>
      </div>
    </div>

    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"
          ><font-awesome-icon :icon="['fas', 'lock']"
        /></span>
        <input
          type="password"
          class="form-control"
          v-model="login.password"
          @input="v$.password.$touch"
          @blur="v$.password.$touch"
          placeholder="app password" />
      </div>

      <div v-for="e of v$.password.$errors" :key="e.$uid">
        <span class="text-danger">{{ e.$message }}</span>
      </div>
    </div>

    <span
      v-if="message.body !== '' && message.type == MESSAGE_TYPE.SUCCESS"
      class="text-success"
      >{{ message.body }}</span
    >
    <span
      v-if="message.body !== '' && message.type == MESSAGE_TYPE.ERROR"
      class="text-danger"
      >{{ message.body }}</span
    >

    <div class="text-end">
      <button
        type="button"
        class="btn btn-outline-primary mb-3"
        @click="sync()"
        :disabled="!state.isValid || state.isLogin">
        Login & Sync
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Vue, { onMounted, reactive, watch } from 'vue'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import { sendToContentScript } from '@plasmohq/messaging'
import { SecureStorage } from '@plasmohq/storage/secure'

import { BskyClient } from '~libs/bskyClient'
import { MESSAGE_TYPE, STORAGE_KEY, UUID } from '~libs/constants'

library.add(fas)

const login = reactive({
  userId: '',
  password: ''
})

const state = reactive({
  isValid: false,
  isLogin: false
})

const message = reactive({
  type: '',
  body: ''
})

const storage = new SecureStorage()

onMounted(async () => {
  await storage.setPassword(UUID)

  login.userId = await storage.get(STORAGE_KEY.USER_ID)
  login.password = await storage.get(STORAGE_KEY.PASSWORD)

  if (login.userId != null && login.password != null) {
    await sync()
  }
})

const rules = {
  userId: { required },
  password: { required }
}

const v$ = useVuelidate(rules, login)

watch(
  login,
  () => {
    state.isValid = !v$.value.$invalid
  },
  { immediate: true }
)

const setMessage = (type: string, body: string) => {
  message.type = type
  message.body = body
}

const sync = async () => {
  const { hasError, message } = await sendToContentScript({
    name: 'twitter-sync-bluesky',
    body: { userId: login.userId, password: login.password }
  }).catch((e) => {
    return { hasError: true, message: e.toString() }
  })

  if (hasError) {
    setMessage(MESSAGE_TYPE.ERROR, message)
  } else {
    setMessage(MESSAGE_TYPE.SUCCESS, 'Login success, start sync to bluesky!')
    state.isLogin = true
    await Promise.all([
      storage.set(STORAGE_KEY.USER_ID, login.userId),
      storage.set(STORAGE_KEY.PASSWORD, login.password)
    ])
  }
}
</script>

<style>
.container {
  min-width: 470px;
}
</style>
