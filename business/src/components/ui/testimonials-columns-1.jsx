"use client";
import React from "react";
import { motion } from "motion/react";

export const TestimonialsColumn = (props) => {
    return (
        <div className={props.className}>
            <motion.div
                animate={{
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6 pb-6"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <div className="p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 max-w-sm w-full bg-white" key={i}>
                                    <div className="text-slate-600 leading-relaxed font-medium">{text}</div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <img
                                            width={48}
                                            height={48}
                                            src={image}
                                            alt={name}
                                            className="h-12 w-12 rounded-full ring-2 ring-blue-50"
                                        />
                                        <div className="flex flex-col">
                                            <div className="font-bold tracking-tight leading-5 text-slate-900">{name}</div>
                                            <div className="text-sm font-medium leading-5 opacity-80 tracking-tight text-blue-600">{role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.div>
        </div>
    );
};
