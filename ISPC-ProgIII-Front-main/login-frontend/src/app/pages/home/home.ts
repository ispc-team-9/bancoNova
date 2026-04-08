import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnDestroy {
  currentSlide = signal(0);
  private autoSlideId: ReturnType<typeof setInterval> | null = null;
  private readonly autoSlideDelayMs = 2000;

  carouselImages = [
    {
      src: '/images/Gemini_Generated_Image_w5dsptw5dsptw5ds_2.png',
      alt: 'Comunicacion corporativa institucional',
      caption: 'Comunicacion institucional orientada a clientes y equipos.'
    },
    {
      src: '/images/Gemini_Generated_Image_4kxvyh4kxvyh4kxv_3.png',
      alt: 'Imagen corporativa y comunicacion de marca',
      caption: 'Canales digitales para una relacion clara y consistente.'
    },
    {
      src: '/images/Gemini_Generated_Image_2h8vut2h8vut2h8v.png',
      alt: 'Estrategia corporativa en equipo',
      caption: 'Procesos de comunicacion que fortalecen la confianza.'
    }
  ];

  constructor() {
    this.startAutoSlide();
  }

  nextSlide(): void {
    this.currentSlide.update((value) => (value + 1) % this.carouselImages.length);
    this.restartAutoSlide();
  }

  previousSlide(): void {
    this.currentSlide.update((value) => (value - 1 + this.carouselImages.length) % this.carouselImages.length);
    this.restartAutoSlide();
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.restartAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideId) {
      clearInterval(this.autoSlideId);
      this.autoSlideId = null;
    }
  }

  private startAutoSlide(): void {
    this.autoSlideId = setInterval(() => {
      this.currentSlide.update((value) => (value + 1) % this.carouselImages.length);
    }, this.autoSlideDelayMs);
  }

  private restartAutoSlide(): void {
    if (this.autoSlideId) {
      clearInterval(this.autoSlideId);
    }
    this.startAutoSlide();
  }
}
