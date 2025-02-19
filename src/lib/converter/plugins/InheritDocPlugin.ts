import {
    ContainerReflection,
    DeclarationReflection,
    ReflectionKind,
    SignatureReflection,
} from "../../models";
import { Component, ConverterComponent } from "../components";
import { Converter } from "../converter";
import type { Context } from "../context";
import { copyComment } from "../utils/reflections";
import {
    Reflection,
    TraverseCallback,
} from "../../models/reflections/abstract";

/**
 * A plugin that handles `inheritDoc` by copying documentation from another API item.
 *
 * What gets copied:
 * - short text
 * - text
 * - `@remarks` block
 * - `@params` block
 * - `@typeParam` block
 * - `@return` block
 */
@Component({ name: "inheritDoc" })
export class InheritDocPlugin extends ConverterComponent {
    /**
     * Create a new InheritDocPlugin instance.
     */
    override initialize() {
        this.listenTo(
            this.owner,
            {
                [Converter.EVENT_RESOLVE]: this.onResolve,
            },
            undefined,
            -200
        );
    }

    /**
     * Triggered when the converter resolves a reflection.
     *
     * Traverse through reflection descendant to check for `inheritDoc` tag.
     * If encountered, the parameter of the tag iss used to determine a source reflection
     * that will provide actual comment.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param reflection  The reflection that is currently resolved.
     */
    private onResolve(_context: Context, reflection: DeclarationReflection) {
        if (reflection instanceof ContainerReflection) {
            const descendantsCallback: TraverseCallback = (item) => {
                item.traverse(descendantsCallback);
                const inheritDoc =
                    item.comment?.getTag("inheritdoc")?.paramName;
                const source =
                    inheritDoc && reflection.findReflectionByName(inheritDoc);
                let referencedReflection = source;
                if (
                    source instanceof DeclarationReflection &&
                    item instanceof SignatureReflection
                ) {
                    const isFunction = source.kindOf(
                        ReflectionKind.FunctionOrMethod
                    );

                    if (isFunction) {
                        // Assumes that if there are overloads, they are declared in the same order as the parent.
                        // TS doesn't check this, but if a user messes this up then they are almost
                        // guaranteed to run into bugs where they can't call a method on a child class
                        // but if they assign (without a type assertion) that child to a variable of the parent class
                        // then they can call the method.
                        const itemIndex =
                            item.parent.signatures?.indexOf(item) ?? 0;
                        referencedReflection = source.signatures?.[itemIndex];
                    }
                }

                if (referencedReflection instanceof Reflection) {
                    copyComment(item, referencedReflection);
                }
                return true;
            };
            reflection.traverse(descendantsCallback);
        }
    }
}
