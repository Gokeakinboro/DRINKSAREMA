"use client";

import React from "react";
import Link from "next/link";
import { Clock, MapPin, Truck, ShieldCheck, Zap } from "lucide-react";

export default function DeliveryInfoPage() {
  return (
    <div className="bg-surface-alt min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-brand-dark sm:text-5xl mb-4">
            Delivery <span className="text-accent">Information</span>
          </h1>
          <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
            Everything you need to know about getting your drinks delivered fast, cold, and right to your doorstep.
          </p>
        </div>

        {/* Hero Feature */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-dark rounded-3xl p-8 md:p-10 text-white shadow-xl mb-12 flex flex-col md:flex-row items-center gap-8 border border-brand-light/30">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-white/10">
            <Zap size={40} className="text-accent fill-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">The 60-Minute Promise</h2>
            <p className="text-white/80 text-lg leading-relaxed">
              We know you want your drinks as fast as possible. For most locations in Lagos, we guarantee delivery in <strong>under 60 minutes</strong>. 
              Our riders are equipped with insulated bags to ensure your drinks arrive perfectly chilled.
            </p>
          </div>
        </div>

        {/* Delivery Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card p-8">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <MapPin size={24} className="text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold text-ink-primary mb-3">Delivery Zones</h3>
            <p className="text-ink-secondary leading-relaxed">
              We currently cover all major areas in Lagos including Ikeja, Victoria Island, Lekki, Ikoyi, Surulere, Yaba, and Maryland. 
              If you are outside these core areas, delivery might take slightly longer (up to 2 hours).
            </p>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
              <Truck size={24} className="text-accent" />
            </div>
            <h3 className="text-xl font-bold text-ink-primary mb-3">Delivery Fees</h3>
            <ul className="space-y-3 text-ink-secondary">
              <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Standard Lagos Delivery</span>
                <span className="font-bold text-ink-primary">₦2,500 - ₦6,000</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Express (Sub-30 mins-select areas)</span>
                <span className="font-bold text-ink-primary">₦5,000</span>
              </li>
              <li className="flex justify-between items-center text-success font-medium pt-1">
                <span>Orders over ₦500,000</span>
                <span>FREE</span>
              </li>
            </ul>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Clock size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-ink-primary mb-3">Operating Hours</h3>
            <p className="text-ink-secondary leading-relaxed mb-4">
              We process and deliver orders during the following hours:
            </p>
            <ul className="space-y-2 text-ink-secondary text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>Mon - Thu:</strong> 9:00 AM - 8:00 PM
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>Fri - Sat:</strong> 9:00 AM - 8:00 PM
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <strong>Sunday:</strong> CLOSED
              </li>
            </ul>
          </div>

          <div className="card p-8">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-ink-primary mb-3">Age Verification</h3>
            <p className="text-ink-secondary leading-relaxed">
              By law, all purchasers must be <strong>18 years or older</strong>. 
              Our delivery riders are trained to ask for a valid government-issued ID upon delivery if you look under 25. 
              We cannot leave alcoholic beverages unattended at your door.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-ink-primary mb-3">Got a large event coming up?</h3>
          <p className="text-ink-secondary mb-6 max-w-lg mx-auto">
            We offer specialized bulk delivery and logistics for weddings, parties, and corporate events.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/event-calculator" className="btn-primary py-3 px-8 text-base">
              Plan Event Drinks
            </Link>
            <Link href="/contact" className="btn-outline border-gray-300 text-ink-primary hover:bg-gray-50 py-3 px-8 text-base">
              Contact Sales
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
