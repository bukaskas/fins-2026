import React from "react";
import Image from "next/image";
import restaurantPhoto from "@/public/images/restaurant/restaurant.webp";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// create a photo container,
// add link button in the middle to forward to the menu
// md screen changes layout to photo on the left, and text with link on the right

function RestaurantPage() {
  return (
    <div className="">
      <h1 className="text-2xl font-bold text-center pt-4">
        Welcome to beautiful dining experience by the beach
      </h1>
      <div className="md:flex">
        <div className="md:w-1/2 flex justify-center relative">
          <Image
            src={restaurantPhoto}
            alt="Restaurant"
            className=" shadow-lg max-h-96 object-cover"
          />
          <Button
            className="rounded-full absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/50 md:hidden"
            variant="outline"
          >
            <Link href="https://drive.google.com/file/d/1ucvNArsKuwd_Em9CXWguJKIIshlh-dG0/view?usp=sharing">
              View Our Menu
            </Link>
          </Button>
          <div className="absolute text-white italic bottom-13 left-1/2 transform -translate-x-1/2  md:hidden">
            “Food tastes better by the beach.”
          </div>
        </div>
        <div className="md:w-1/2 p-4 md:flex flex-col justify-center hidden ">
          <p className="mb-4">
            Our restaurant offers a unique dining experience right by the beach,
            where you can enjoy delicious meals while taking in the stunning sea
            views. Whether you're looking for a romantic dinner, a family
            outing, or a casual meal with friends, our menu has something for
            everyone.
          </p>
          <p className="mb-4">
            From fresh seafood to gourmet dishes, our chefs use the finest
            ingredients to create mouth-watering meals that will satisfy your
            taste buds. Don't forget to check out our selection of fine wines
            and refreshing cocktails to complement your dining experience.
          </p>
          <Button className="rounded-full" variant="outline">
            <Link href="https://drive.google.com/file/d/1ucvNArsKuwd_Em9CXWguJKIIshlh-dG0/view?usp=sharing">
              View Our Menu
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RestaurantPage;
