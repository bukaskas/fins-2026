import Image from "next/image";
import storyPhoto from "@/public/images/about/fins.webp";
import teamPhoto from "@/public/images/about/fins_staff.webp";
import communityPhoto from "@/public/images/about/fins_community.webp";
function AboutPage() {
  return (
    <>
      <section className="md:flex flex-col  ">
        <div className="text-center text-2xl font-bold">About us</div>
        {/* Story section */}
        <div className="flex flex-col md:flex-row ">
          <div className="w-full md:w-1/2">
            <Image
              src={storyPhoto}
              alt="Our Story"
              className="h-64 md:h-full w-full object-cover"
            />
          </div>
          <div className="w-full md:w-1/2 p-4 md:p-6">
            <h1 className="text-xl font-semibold pb-4">Our Story</h1>
            <div>
              Our story began back in <strong>2007</strong>, when we first
              discovered kitesurfing. What started as a hobby quickly became a
              passion that took over our free time. We traveled, explored new
              spots, and immersed ourselves in the kitesurfing lifestyle.
            </div>
            <div>
              Years later, that passion evolved into offering professional
              kitesurfing courses and experiences. We searched for a place that
              would provide both comfort and convenience, where people could
              safely begin their kitesurfing journey while friends and family
              could relax and enjoy nature together.
            </div>
            <div>
              In 2020, after meeting <strong>Kai Sokhna</strong>, we knew we had
              found the perfect location. The spot offers ideal and safe
              conditions for learning kitesurfing, a long sandy beach, and a
              luxury restaurant and lounge—everything needed to enjoy a perfect
              day by the sea.
            </div>
          </div>
        </div>
        {/* Team section */}
        <div className="flex flex-col md:flex-row-reverse ">
          <div className="w-full md:w-1/2">
            <Image
              src={teamPhoto}
              alt="Our Story"
              className="h-64 md:h-full w-full object-cover"
            />
          </div>
          <div className="w-full md:w-1/2 md:p-6">
            <h1 className="text-xl font-semibold pb-4">Team</h1>
            <div>
              Our team is here to support you every step of the way. We take
              care of your needs, create a friendly atmosphere, and do our best
              to make you feel at home from the moment you arrive. Everyone is
              here to help—and to make your experience unforgettable.
            </div>
          </div>
        </div>
        <div className="flex flex-col  md:flex-row">
          <div className="w-full md:w-1/2">
            <Image
              src={communityPhoto}
              alt="Our Story"
              className="h-64 md:h-full w-full object-cover"
            />
          </div>

          <div className="w-full md:w-1/2 md:p-6">
            <h1 className="text-xl font-semibold pb-4">Community</h1>
            <div>
              We believe adventures are meant to be shared. That's why we focus
              on creating a welcoming community where people feel comfortable,
              connected, and encouraged to push their limits together through
              games, challenges, and events.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutPage;
