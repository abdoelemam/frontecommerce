"use client";

import React, { useEffect } from "react";

export default function BrandStoryPage() {
  // Intersection Observer for scroll reveal animations
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-body overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative w-full h-[921px] min-h-[600px] flex items-center justify-center overflow-hidden pt-20 -mt-20">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center scale-105" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDVNt__7Htj1bS0wLLuijOO6qwCZFUV4Vpn1KGjG6SyAgAPaJberc8RK8t1Bs3nPfLGiLEdGLkvIn2MN9oweU0pTV-h194VxU1z8QVrMRhmAkL2-Al7iXf_hiyHjsh9xuiwbWLaEBHeftXJuZ5zI_GbhHo8XiLBITzDoBhWR8Rol0rg0Wj55bntAFPxSP1bjdLhFtVV-4NAwbphbeRlyqApco-R_yfCt-80uAuRZ-ab04fobT9WPRzl1nUg-NdJWQ0OezXDGDgjo9I')",
            backgroundAttachment: "fixed"
          }}
        >
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]"></div>
          {/* Gradient to blend into next section */}
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center reveal">
          <h1 className="font-display text-[56px] md:text-[80px] text-white leading-tight mb-6 drop-shadow-lg font-bold">
            Conscious Craftsmanship
          </h1>
          <p className="font-body text-[18px] text-white/95 max-w-2xl mx-auto tracking-wide drop-shadow-md leading-relaxed">
            Redefining luxury through intentional design, uncompromising quality, and a profound respect for the world we inhabit.
          </p>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-container-max mx-auto px-6 py-20 flex flex-col gap-20 md:gap-[120px]">
        
        {/* Our Heritage Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20 items-center reveal">
          <div className="order-2 md:order-1 relative h-[500px] md:h-[700px] w-full overflow-hidden rounded-sm group">
            <div 
              className="absolute inset-0 bg-surface-variant transition-transform duration-700 group-hover:scale-105" 
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBwKnDOMz6tluBu6BiJQg1eSoUQE1YB5PW8nyYxiQ-eLc5hWuzL2D9rTq2GKlfRyRXS_n0QmCVp9lqec1d3xorf4dXnUw158gmjCYf6xdHJBSr5ORx63D13k0grhyry2AYWZsBh-iern3Bu4SQqkA9EF2xiyvQwO9CTzywQ4xSh2kA_QW2bj0isLl1ScplsInIizX2X3PDP6qFLgdCDgZq5l6Ggz-ChRc9H0R90Zca-RrUSOH5M0uXRw6n6wnIYbPXAl-HsqDQL0Dg')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
          </div>
          <div className="order-1 md:order-2 flex flex-col gap-6 md:pr-10">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-outline"></span>
              <span className="font-body text-[14px] text-outline uppercase tracking-widest">Heritage</span>
            </div>
            <h2 className="font-display text-[32px] md:text-[48px] text-primary leading-tight font-semibold">
              A Legacy of Intention
            </h2>
            <div className="space-y-4 font-body text-[16px] text-on-surface-variant leading-relaxed">
              <p>
                AURORA was born from a singular vision: to create objects of enduring beauty without compromising the integrity of our environment. Our journey began in the quiet ateliers of Europe, where generations of artisans have perfected their craft.
              </p>
              <p>
                We do not simply produce; we curate. Every piece is a dialogue between traditional techniques and modern sensibilities. We believe that true luxury lies in patience—the time taken to source ethically, design thoughtfully, and craft meticulously.
              </p>
            </div>
            <div className="mt-4">
              <blockquote className="font-display text-[22px] text-primary italic border-l-2 border-outline-variant pl-6 py-2">
                "Luxury is not a shout, but a whisper of quality that endures time."
              </blockquote>
            </div>
          </div>
        </section>

        {/* Sustainable Materials Bento Grid */}
        <section className="flex flex-col gap-6 reveal pt-10">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-outline"></span>
              <span className="font-body text-[14px] text-outline uppercase tracking-widest">Materials</span>
              <span className="w-8 h-[1px] bg-outline"></span>
            </div>
            <h2 className="font-display text-[32px] md:text-[48px] text-primary leading-tight font-semibold">
              The Elements of Elegance
            </h2>
            <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
              Our palette is drawn strictly from nature. We utilize only materials that meet rigorous environmental standards, ensuring transparency from origin to atelier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-[300px] md:auto-rows-[400px]">
            {/* Organic Silk Card (Large) */}
            <div className="md:col-span-8 relative rounded-lg overflow-hidden group bg-surface-container-low shadow-[0px_4px_20px_rgba(15,23,42,0.03)] border border-surface-variant flex flex-col justify-end p-10">
              <div 
                className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105" 
                style={{ 
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBl_SE5_1lLRAxipRZyASNDRQmoX8BiB2S7wTG8NGT3h7xQ1K9w4wNPaNJ_TUUJBQYmyUo3KYL-miQEB9tVI1EaOMcePieYI8xjZAx4OcMiFORlmmbSaDiMsjRg3bIg9_7xi6F6fwMINS6xKp09_a3VUyfgfzwiO9IBkowmwBm5ZLJFqn6Qmsadc3UGR4qDAZYhcHd68rZJHbSZ43WNHvMsOZsohebvuUT01vIbMixiTvkII0uynPvcZyWm3F-VDgjuKukSx38reHU')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
              </div>
              <div className="relative z-10 text-white">
                <span className="material-symbols-outlined text-[32px] mb-2 opacity-80" style={{ fontVariationSettings: "'FILL' 0" }}>psychiatry</span>
                <h3 className="font-display text-[32px] mb-1 font-semibold">Organic Silk</h3>
                <p className="font-body text-[14px] opacity-90 max-w-md">
                  Sourced from regenerative farms, our silk is woven without toxic dyes, preserving the natural luster and integrity of the fiber.
                </p>
              </div>
            </div>

            {/* Recycled Cashmere Card (Small) */}
            <div className="md:col-span-4 relative rounded-lg overflow-hidden group bg-surface-container flex flex-col justify-between p-6 border border-surface-variant hover:shadow-[0px_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300">
              <div className="absolute right-0 top-0 w-32 h-32 opacity-10 pointer-events-none text-primary">
                <span className="material-symbols-outlined text-[120px]">recycling</span>
              </div>
              <div>
                <span className="material-symbols-outlined text-[28px] text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>recycling</span>
                <h3 className="font-display text-[24px] text-primary mb-2 font-semibold">Recycled Cashmere</h3>
                <p className="font-body text-[14px] text-on-surface-variant">
                  Re-spun from post-consumer garments, offering unparalleled softness while reducing waste and water consumption by over 80%.
                </p>
              </div>
              <div className="w-full h-32 rounded-sm mt-4 overflow-hidden">
                <div 
                  className="w-full h-full bg-surface-variant transition-transform duration-700 group-hover:scale-105" 
                  style={{ 
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFFpLqkRivtRT9ueQNQU0wzVJeJ3GPI-U-WXxZf-BXPmjSlbh0OKuwvrVMkhtpZp6JsQLliGMon6hlhxT34hpJl-O5XovHkSqe5MJJsIQsEFSzHfLr2WC7FwHVEo8Uv_7bR35fFl1Kz2KstlOGzrITEjCrKCj62UdICV9AQ0-Aaxe4y3-zbpBvKd_8NAKsnmmPp97nsHRHko57XCTns9yMqxRoky8R_5hyFCPMfBgIMvbPJetY9ZjxJhmKyVmxqIvv7iGG6_JdGJk')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
              </div>
            </div>

            {/* Innovation Card (Small) */}
            <div className="md:col-span-4 rounded-lg bg-primary text-white flex flex-col justify-center items-center text-center p-10 hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] transition-all duration-300">
              <span className="material-symbols-outlined text-[40px] text-secondary-container mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>eco</span>
              <h3 className="font-display text-[24px] mb-2 font-semibold">Plant-Based Alternatives</h3>
              <p className="font-body text-[14px] opacity-80">
                Exploring next-generation bio-materials derived from agricultural byproducts to replace synthetic hardware.
              </p>
            </div>

            {/* Transparency Card (Large) */}
            <div className="md:col-span-8 relative rounded-lg overflow-hidden group bg-surface-container-highest flex flex-col justify-center p-10 border border-surface-variant">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[120%] opacity-20 pointer-events-none overflow-hidden mix-blend-multiply">
                <div className="w-full h-full bg-gradient-to-r from-transparent to-primary/10"></div>
              </div>
              <div className="relative z-10 max-w-lg">
                <span className="material-symbols-outlined text-[32px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span>
                <h3 className="font-display text-[32px] text-primary mb-4 font-semibold">Absolute Transparency</h3>
                <p className="font-body text-[16px] text-on-surface-variant mb-6 leading-relaxed">
                  Every garment carries a digital passport detailing its journey from fiber to finished piece. We hold ourselves accountable to the highest ecological and ethical standards.
                </p>
                <a className="inline-flex items-center gap-1 font-body text-[14px] font-bold text-primary hover:text-secondary-fixed transition-colors group/link" href="#">
                  Explore the Supply Chain
                  <span className="material-symbols-outlined text-[16px] group-hover/link:translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* The Atelier Section */}
        <section className="reveal pt-10">
          <div className="bg-surface-lowest border border-surface-variant rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(15,23,42,0.02)]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 md:p-20 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-8 h-[1px] bg-outline"></span>
                  <span className="font-body text-[14px] text-outline uppercase tracking-widest">The Atelier</span>
                </div>
                <h2 className="font-display text-[32px] md:text-[48px] text-primary mb-4 leading-tight font-semibold">
                  Where Time Slows Down
                </h2>
                <p className="font-body text-[18px] text-on-surface-variant mb-10 leading-relaxed">
                  Our atelier is a sanctuary of precision. Here, mass production is eschewed in favor of deliberate, focused craftsmanship. Every stitch is a commitment; every cut is a calculation.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>handyman</span>
                    </div>
                    <div>
                      <h4 className="font-body text-[14px] font-bold text-primary mb-1 uppercase tracking-wider">Master Artisans</h4>
                      <p className="font-body text-[14px] text-on-surface-variant">Decades of specialized experience applied to every garment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>water_drop</span>
                    </div>
                    <div>
                      <h4 className="font-body text-[14px] font-bold text-primary mb-1 uppercase tracking-wider">Zero-Waste Cutting</h4>
                      <p className="font-body text-[14px] text-on-surface-variant">Innovative pattern making that ensures minimal fabric offcuts.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] lg:h-auto w-full min-h-[400px] group overflow-hidden">
                <div 
                  className="absolute inset-0 bg-surface-variant transition-transform duration-700 group-hover:scale-105" 
                  style={{ 
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7_OjiKq8xknV8dSS4Z1SL24eyakNJw31xSJJqhpQdvPIUGNS76UQx_cNXp319i4I9rdxCcIo-Vj9sJLWFAmvgQ-jFCAKp2HQvkYEM_PTXNzJxJZWnHgMwv9moirdvC9GStf-xHmJutvqqJiJlSvTZH6ho72YmJy75XYG55Q32RWqR2y2Fw-3KVrV2s7TJM8imfQcCky7MHV0_69uOZWhFuA23GcoEMqK9Gj0rTLJdASs44r-idwWxQEOT_PhqPS7KQj2IxIUs4a4')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Commitment 2030 Timeline */}
        <section className="reveal pt-10 pb-10">
          <div className="flex flex-col md:flex-row gap-10 md:gap-20">
            <div className="md:w-1/3">
              <div className="sticky top-32">
                <h2 className="font-display text-[32px] md:text-[48px] text-primary mb-4 font-semibold">
                  Commitment 2030
                </h2>
                <p className="font-body text-[16px] text-on-surface-variant mb-6 leading-relaxed">
                  Sustainability is not an endpoint, but a continuous evolution. We have set definitive, measurable goals to ensure our impact on the planet is restorative.
                </p>
                <a className="inline-block px-10 py-4 bg-primary text-white font-body text-[14px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-colors shadow-md hover:shadow-lg" href="#">
                  Read Full Report
                </a>
              </div>
            </div>
            <div className="md:w-2/3 relative border-l border-outline-variant pl-6 md:pl-10 space-y-10">
              {/* Timeline Item 1 */}
              <div className="relative font-body">
                <div className="absolute -left-[33px] md:-left-[49px] top-1 w-4 h-4 rounded-full bg-secondary-container border-4 border-background"></div>
                <span className="font-body text-[14px] font-bold text-secondary-fixed block mb-2">2025</span>
                <h3 className="font-display text-[24px] text-primary font-semibold mb-2">100% Circular Packaging</h3>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
                  Eliminating all single-use plastics from our logistics and transitioning entirely to biodegradable, mushroom-based mycelium packaging for all client orders.
                </p>
              </div>
              {/* Timeline Item 2 */}
              <div className="relative font-body">
                <div className="absolute -left-[33px] md:-left-[49px] top-1 w-4 h-4 rounded-full bg-outline-variant border-4 border-background"></div>
                <span className="font-body text-[14px] font-bold text-outline block mb-2">2027</span>
                <h3 className="font-display text-[24px] text-primary font-semibold mb-2">Carbon Negative Operations</h3>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
                  Moving beyond neutrality by investing in regenerative agriculture and direct air capture technologies to remove more carbon than our entire supply chain emits.
                </p>
              </div>
              {/* Timeline Item 3 */}
              <div className="relative font-body">
                <div className="absolute -left-[33px] md:-left-[49px] top-1 w-4 h-4 rounded-full bg-outline-variant border-4 border-background"></div>
                <span className="font-body text-[14px] font-bold text-outline block mb-2">2030</span>
                <h3 className="font-display text-[24px] text-primary font-semibold mb-2">Closed-Loop Collection</h3>
                <p className="font-body text-[16px] text-on-surface-variant leading-relaxed">
                  Every AURORA garment will be designed for complete disassembly and infinite recyclability, supported by a global take-back program to ensure zero garments reach landfills.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
