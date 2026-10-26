// GSAP (licence « standard no-charge ») : plugins enregistrés une fois, côté navigateur.
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin)
  gsap.defaults({ ease: 'power2.out' })
})
