import{t as e}from"./rolldown-runtime.Dh6celcD.mjs";import{I as t,Q as n,o as r}from"./framer.BOZTuBG1.mjs";var i,a=e((()=>{n(),i=t({title:`Particles`,resolutionScale:`consistent`,fragment:`
// PCG hash
uint pcg(uint v) {
    uint state = v * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}

float hash1(float p) {
    return float(pcg(floatBitsToUint(p))) / float(0xFFFFFFFFu);
}

void main() {
    vec4 O = vec4(0.);
    vec2 r = u_resolution;
    vec2 I = gl_FragCoord.xy;
    vec2 uv = (I + I - r) / r.y;
    uv /= u_scale; 
    float d = length(uv);
    float t = u_time * u_speed;

    // Convert angle to direction vector
    float rad = u_direction * 3.14159265 / 180.;
    vec2 dir = vec2(cos(rad), sin(rad));

    // Glow: remap 0..1 to a power exponent range
    float sharpness = mix(0.3, 2.0, u_glow);

    // Color channel offsets
    vec4 colOffset = u_customColor > .5
        ? vec4(u_colorR, u_colorG, u_colorB, 0.)
        : vec4(3., 3., 3., 0.);
        
    float iterations = 20. + u_layer;

    for (float i = 20.; i++ < iterations;)
    {
        vec2 q;
        float fade, blink, light, clamper;

        if (u_warp > .5) {
            vec2 p = vec2(atan(uv.x, uv.y), 1. / (d * u_tunnelRadius + .001));
            q = p * 6e1 / i;
            float warpD = u_warpDirection > 0.5 ? -1.0 : 1.0;
            q.y += warpD * t;
            q += cos(i * vec2(9, 7));
            fade = smoothstep(0., u_fadeRadius, d);
            blink = 1.;
            light = u_brightness * 1.8e-4;
            clamper = u_starSize;
        } else {
            q = uv * 4e1 / i + cos(i * vec2(9, 7));

            if (u_randomize > .5) {
                float angle = hash1(i * 123.456) * 6.28318;
                vec2 rdir = vec2(cos(angle), sin(angle));
                q += rdir * t * .3;
            } else {
                q += dir * t * .3;
            }

            fade = 1.;

            if (u_blink > .5) {
                blink = sin(t * (1. + fract(i * .737) * 4.) + i * 3.14) * .5 + .5;
                blink = blink * .3 + .3;
            } else {
                blink = .3;
            }

            light = u_brightness * 3e-4;
            clamper = u_starSize;
        }

        // Apply sharpness via power on the distance field
        float dist = max(length(sin(q * 3.)), clamper);
        dist = pow(dist, sharpness);

        O += (i * cos(i + colOffset) + i) * light * blink * fade / dist;
    }

    O = tanh(O * O);
    float a = u_bgColor.a;
    fragColor = vec4((u_bgColor.rgb * a + O.rgb), clamp(a + O.r + O.g + O.b, 0., 1.));
}
`,propertyControls:{bgColor:{type:r.Color,title:`Background`,defaultValue:`#000000`},warp:{type:r.Boolean,title:`Warp`,defaultValue:!1},randomize:{type:r.Boolean,title:`Randomize`,defaultValue:!0,hidden:e=>e.warp},direction:{type:r.Number,title:`Direction`,defaultValue:90,min:0,max:360,step:1,hidden:e=>e.warp||e.randomize},warpDirection:{type:r.Enum,title:`Direction`,options:[0,1],optionTitles:[`Forward`,`Reverse`],defaultValue:0,displaySegmentedControl:!0,hidden:e=>!e.warp},speed:{type:r.Number,title:`Speed`,defaultValue:.6,min:0,max:5,step:.1},scale:{type:r.Number,title:`Scale`,defaultValue:.8,min:.3,max:2,step:.1},layer:{type:r.Number,title:`Layers`,defaultValue:30,min:0,max:30,step:1,hiddenWhenUnset:!0},brightness:{type:r.Number,title:`Brightness`,defaultValue:1,min:.01,max:3,step:.01},glow:{type:r.Number,title:`Size`,defaultValue:.7,min:0,max:2,step:.01},blink:{type:r.Boolean,title:`Blink`,defaultValue:!1,hidden:e=>e.warp},tunnelRadius:{type:r.Number,title:`Radius`,defaultValue:2,min:1,max:8,step:.1,hidden:e=>!e.warp},fadeRadius:{type:r.Number,title:`Fade`,defaultValue:1.2,min:.1,max:3,step:.1,displayStepper:!0,hidden:e=>!e.warp},starSize:{type:r.Number,title:`Blur`,defaultValue:.01,min:0,max:.3,step:.01,hiddenWhenUnset:!0},customColor:{type:r.Boolean,title:`Color`,defaultValue:!1,hiddenWhenUnset:!0},colorR:{type:r.Number,title:`Red`,defaultValue:1,min:0,max:3,step:.5,displayStepper:!0,hidden:e=>!e.customColor},colorG:{type:r.Number,title:`Green`,defaultValue:2,min:0,max:3,step:.5,displayStepper:!0,hidden:e=>!e.customColor},colorB:{type:r.Number,title:`Blue`,defaultValue:3,min:0,max:3,step:.5,displayStepper:!0,hidden:e=>!e.customColor}}})}));export{a as n,i as t};
//# sourceMappingURL=StarSpace.D2g-TLLi.mjs.map