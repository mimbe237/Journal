'use client';

import { useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Jean-Pierre Kamga',
    role: 'Directeur Général',
    company: 'TechCorp Cameroun',
    content: 'Un service exceptionnel ! Grâce à l\'abonnement entreprise, toute mon équipe a accès aux dernières éditions. La plateforme est intuitive et le support réactif.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marie Ngono',
    role: 'Journaliste Indépendante',
    content: 'Je ne peux plus me passer de cette plateforme. L\'accès aux archives et la qualité de lecture sur mobile sont parfaits pour mon travail de veille.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Paul Essomba',
    role: 'Étudiant en Droit',
    company: 'Université de Yaoundé',
    content: 'Les tarifs étudiants sont très abordables et j\'ai accès à toutes les éditions pour mes recherches. L\'interface est claire et facile à utiliser.',
    rating: 4,
  },
  {
    id: '4',
    name: 'Françoise Bella',
    role: 'Responsable RH',
    company: 'Groupe Financier ABC',
    content: 'La gestion des accès pour notre équipe de 50 personnes est simplifiée. Les rapports de lecture nous permettent de suivre l\'engagement de nos collaborateurs.',
    rating: 5,
  },
  {
    id: '5',
    name: 'André Mbarga',
    role: 'Retraité',
    content: 'Après 40 ans à lire le journal papier, j\'ai fait la transition au numérique. Le confort de lecture est excellent, même sur ma tablette.',
    rating: 5,
  },
  {
    id: '6',
    name: 'Sabine Atangana',
    role: 'Cheffe d\'Entreprise',
    company: 'SA Import-Export',
    content: 'Un gain de temps considérable. Je lis les actualités économiques pendant mes déplacements. Le téléchargement hors-ligne est un vrai plus.',
    rating: 4,
  },
];

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

export function TestimonialsSection({
  title = 'Ce que disent nos lecteurs',
  subtitle = 'Des milliers de lecteurs nous font confiance chaque jour',
  limit = 6,
}: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const displayedTestimonials = TESTIMONIALS.slice(0, limit);
  const itemsPerView = 3;
  const maxIndex = Math.ceil(displayedTestimonials.length / itemsPerView) - 1;

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, maxIndex]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-slate-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="mt-3 text-lg text-slate-600">{subtitle}</p>
        </div>

        {/* Testimonials Grid - Desktop */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {displayedTestimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} renderStars={renderStars} />
          ))}
        </div>

        {/* Testimonials Carousel - Mobile */}
        <div
          className="md:hidden relative overflow-hidden"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {displayedTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="w-full flex-shrink-0 px-2">
                <TestimonialCard testimonial={testimonial} renderStars={renderStars} />
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {displayedTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-200 pt-12">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">10K+</p>
            <p className="mt-1 text-sm text-slate-600">Abonnés actifs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">500+</p>
            <p className="mt-1 text-sm text-slate-600">Entreprises</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">4.8/5</p>
            <p className="mt-1 text-sm text-slate-600">Note moyenne</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">98%</p>
            <p className="mt-1 text-sm text-slate-600">Taux de satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  renderStars,
}: {
  testimonial: Testimonial;
  renderStars: (rating: number) => ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 flex flex-col h-full">
      {/* Rating */}
      {renderStars(testimonial.rating)}

      {/* Content */}
      <p className="mt-4 text-slate-700 flex-1 italic">
        "{testimonial.content}"
      </p>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">
          {testimonial.avatar ? (
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            testimonial.name.charAt(0)
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900">{testimonial.name}</p>
          <p className="text-sm text-slate-500">
            {testimonial.role}
            {testimonial.company && `, ${testimonial.company}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestimonialsSection;
